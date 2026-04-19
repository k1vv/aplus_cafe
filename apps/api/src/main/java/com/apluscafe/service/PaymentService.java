package com.apluscafe.service;

import com.apluscafe.dto.request.DirectCheckoutRequest;
import com.apluscafe.dto.response.CheckoutResponse;
import com.apluscafe.entity.*;
import com.apluscafe.enums.DeliveryStatus;
import com.apluscafe.enums.OrderStatus;
import com.apluscafe.enums.OrderType;
import com.apluscafe.enums.PaymentStatus;
import com.apluscafe.repository.*;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final MenuRepository menuRepository;
    private final DeliveryRepository deliveryRepository;
    private final EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    @Transactional
    public CheckoutResponse createDirectCheckoutSession(DirectCheckoutRequest request, Long userId) throws StripeException {
        log.info("Creating direct checkout session for user ID: {}", userId);

        // Calculate totals
        BigDecimal subtotal = BigDecimal.ZERO;
        for (DirectCheckoutRequest.CheckoutItem item : request.getItems()) {
            subtotal = subtotal.add(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }

        // Calculate service charge (6%) and delivery fee
        BigDecimal serviceCharge = subtotal.multiply(BigDecimal.valueOf(0.06));
        boolean isDelivery = request.getDeliveryDetails() != null &&
                !"PICKUP".equals(request.getDeliveryDetails().getAddress()) &&
                !"DINE_IN".equals(request.getDeliveryDetails().getAddress());
        BigDecimal deliveryFee = isDelivery ? BigDecimal.valueOf(3.00) : BigDecimal.ZERO;
        BigDecimal totalAmount = subtotal.add(serviceCharge).add(deliveryFee);

        long amountInCents = totalAmount.multiply(BigDecimal.valueOf(100)).longValue();
        log.debug("Creating Stripe embedded checkout session with amount: {} cents", amountInCents);

        // Build line items for Stripe
        SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setUiMode(SessionCreateParams.UiMode.EMBEDDED)
                .setReturnUrl(request.getReturnUrl());

        // Add customer email if provided
        if (request.getCustomerEmail() != null && !request.getCustomerEmail().isEmpty()) {
            paramsBuilder.setCustomerEmail(request.getCustomerEmail());
        }

        // Add each item as a line item
        for (DirectCheckoutRequest.CheckoutItem item : request.getItems()) {
            long itemAmountInCents = item.getPrice().multiply(BigDecimal.valueOf(100)).longValue();
            paramsBuilder.addLineItem(
                    SessionCreateParams.LineItem.builder()
                            .setQuantity((long) item.getQuantity())
                            .setPriceData(
                                    SessionCreateParams.LineItem.PriceData.builder()
                                            .setCurrency("myr")
                                            .setUnitAmount(itemAmountInCents)
                                            .setProductData(
                                                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                            .setName(item.getName())
                                                            .build()
                                            )
                                            .build()
                            )
                            .build()
            );
        }

        // Add service charge as line item
        if (serviceCharge.compareTo(BigDecimal.ZERO) > 0) {
            paramsBuilder.addLineItem(
                    SessionCreateParams.LineItem.builder()
                            .setQuantity(1L)
                            .setPriceData(
                                    SessionCreateParams.LineItem.PriceData.builder()
                                            .setCurrency("myr")
                                            .setUnitAmount(serviceCharge.multiply(BigDecimal.valueOf(100)).longValue())
                                            .setProductData(
                                                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                            .setName("Service Charge (SST 6%)")
                                                            .build()
                                            )
                                            .build()
                            )
                            .build()
            );
        }

        // Add delivery fee as line item
        if (deliveryFee.compareTo(BigDecimal.ZERO) > 0) {
            paramsBuilder.addLineItem(
                    SessionCreateParams.LineItem.builder()
                            .setQuantity(1L)
                            .setPriceData(
                                    SessionCreateParams.LineItem.PriceData.builder()
                                            .setCurrency("myr")
                                            .setUnitAmount(deliveryFee.multiply(BigDecimal.valueOf(100)).longValue())
                                            .setProductData(
                                                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                            .setName("Delivery Fee")
                                                            .build()
                                            )
                                            .build()
                            )
                            .build()
            );
        }

        // Store delivery details in metadata for order creation after payment
        Map<String, String> metadata = new HashMap<>();
        if (userId != null) {
            metadata.put("user_id", userId.toString());
        }
        metadata.put("customer_name", request.getDeliveryDetails().getName());
        metadata.put("customer_phone", request.getDeliveryDetails().getPhone());
        metadata.put("delivery_address", request.getDeliveryDetails().getAddress());
        if (request.getDeliveryDetails().getNotes() != null) {
            metadata.put("notes", request.getDeliveryDetails().getNotes());
        }
        if (request.getDeliveryDetails().getContactless() != null && request.getDeliveryDetails().getContactless()) {
            metadata.put("contactless", "true");
        }

        // Store item details in metadata for order creation (JSON format)
        // Format: "item_0": "name|price|quantity", "item_1": "name|price|quantity", etc.
        int itemIndex = 0;
        for (DirectCheckoutRequest.CheckoutItem item : request.getItems()) {
            metadata.put("item_" + itemIndex, item.getName() + "|" + item.getPrice().toPlainString() + "|" + item.getQuantity());
            itemIndex++;
        }
        metadata.put("item_count", String.valueOf(request.getItems().size()));

        paramsBuilder.putAllMetadata(metadata);

        Session session = Session.create(paramsBuilder.build());
        log.info("Stripe embedded checkout session created: {}", session.getId());

        return CheckoutResponse.builder()
                .sessionId(session.getId())
                .clientSecret(session.getClientSecret())
                .build();
    }

    @Transactional
    public CheckoutResponse createCheckoutSession(Long orderId, Long userId) throws StripeException {
        log.info("Creating checkout session for order ID: {}, user ID: {}", orderId, userId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> {
                    log.error("Order not found for checkout: {}", orderId);
                    return new RuntimeException("Order not found");
                });

        if (!order.getUser().getId().equals(userId)) {
            log.warn("User {} attempted to checkout order {} belonging to user {}",
                    userId, orderId, order.getUser().getId());
            throw new RuntimeException("Order not found");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            log.warn("Checkout attempted for non-pending order {} with status: {}", orderId, order.getStatus());
            throw new RuntimeException("Order is not in pending status");
        }

        // Check if payment already exists
        Payment existingPayment = paymentRepository.findByOrderId(orderId).orElse(null);
        if (existingPayment != null && existingPayment.getStatus() == PaymentStatus.COMPLETED) {
            log.warn("Checkout attempted for already paid order: {}", orderId);
            throw new RuntimeException("Order already paid");
        }

        // Create Stripe checkout session
        long amountInCents = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();
        log.debug("Creating Stripe session for order {} with amount: {} cents", orderId, amountInCents);

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(frontendUrl + "/checkout/success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendUrl + "/checkout/cancel?order_id=" + orderId)
                .setCustomerEmail(order.getUser().getEmail())
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("myr")
                                                .setUnitAmount(amountInCents)
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("Order #" + orderId)
                                                                .setDescription("APlus Cafe Order")
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                )
                .putMetadata("order_id", orderId.toString())
                .build();

        Session session = Session.create(params);
        log.info("Stripe checkout session created: {} for order: {}", session.getId(), orderId);

        // Create or update payment record
        Payment payment = existingPayment != null ? existingPayment : new Payment();
        payment.setOrder(order);
        payment.setStripeSessionId(session.getId());
        payment.setAmount(order.getTotalAmount());
        payment.setCurrency("MYR");
        payment.setStatus(PaymentStatus.PENDING);
        paymentRepository.save(payment);
        log.debug("Payment record saved for order: {}, session: {}", orderId, session.getId());

        return CheckoutResponse.builder()
                .sessionId(session.getId())
                .sessionUrl(session.getUrl())
                .build();
    }

    @Transactional
    public void handleWebhookEvent(String payload, String sigHeader) {
        log.info("Received Stripe webhook event");

        if (payload == null || sigHeader == null) {
            log.warn("Missing payload or signature header in webhook request");
            return;
        }

        Event event;
        try {
            // Verify webhook signature
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
            log.info("Webhook event verified: type={}, id={}", event.getType(), event.getId());
        } catch (SignatureVerificationException e) {
            log.error("Webhook signature verification failed: {}", e.getMessage());
            throw new RuntimeException("Invalid webhook signature");
        } catch (Exception e) {
            log.error("Failed to parse webhook event: {}", e.getMessage());
            throw new RuntimeException("Failed to parse webhook event");
        }

        // Handle different event types
        switch (event.getType()) {
            case "checkout.session.completed" -> handleCheckoutSessionCompleted(event);
            case "checkout.session.expired" -> handleCheckoutSessionExpired(event);
            case "payment_intent.succeeded" -> log.info("Payment intent succeeded: {}", event.getId());
            case "payment_intent.payment_failed" -> handlePaymentFailed(event);
            default -> log.debug("Unhandled event type: {}", event.getType());
        }
    }

    private void handleCheckoutSessionCompleted(Event event) {
        try {
            // Extract session from event data
            Session session = (Session) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new RuntimeException("Session not found in event"));

            String sessionId = session.getId();
            log.info("Processing checkout.session.completed for session: {}", sessionId);

            // Check if payment record already exists (order-based checkout)
            Payment existingPayment = paymentRepository.findByStripeSessionId(sessionId).orElse(null);

            if (existingPayment != null) {
                // Order-based checkout - just confirm the payment
                confirmPayment(sessionId, null);
                log.info("Existing order payment confirmed via webhook for session: {}", sessionId);
            } else {
                // Direct checkout - create order from session metadata
                createOrderFromStripeSession(session, null);
                log.info("New order created from direct checkout session: {}", sessionId);
            }
        } catch (Exception e) {
            log.error("Error handling checkout.session.completed: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process checkout session completed event", e);
        }
    }

    private void handleCheckoutSessionExpired(Event event) {
        try {
            Session session = (Session) event.getDataObjectDeserializer()
                    .getObject()
                    .orElse(null);

            if (session != null) {
                log.info("Checkout session expired: {}", session.getId());

                // Update payment status if exists
                paymentRepository.findByStripeSessionId(session.getId()).ifPresent(payment -> {
                    payment.setStatus(PaymentStatus.FAILED);
                    paymentRepository.save(payment);
                    log.info("Payment marked as FAILED for expired session: {}", session.getId());
                });
            }
        } catch (Exception e) {
            log.error("Error handling checkout.session.expired: {}", e.getMessage());
        }
    }

    private void handlePaymentFailed(Event event) {
        log.warn("Payment failed event received: {}", event.getId());
        // Handle payment failure - could notify user, update order status, etc.
    }

    @Transactional
    public void confirmPayment(String sessionId, Long userId) {
        log.info("Confirming payment for session: {}, userId: {}", sessionId, userId);

        // Check if payment/order already exists
        Payment existingPayment = paymentRepository.findByStripeSessionId(sessionId).orElse(null);

        if (existingPayment != null) {
            // Order-based checkout - payment record exists, just confirm it
            existingPayment.setStatus(PaymentStatus.COMPLETED);
            paymentRepository.save(existingPayment);
            log.info("Payment completed for order: {}, amount: {} {}",
                    existingPayment.getOrder().getId(), existingPayment.getAmount(), existingPayment.getCurrency());

            Order order = existingPayment.getOrder();
            if (order.getStatus() == OrderStatus.PENDING) {
                order.setStatus(OrderStatus.CONFIRMED);
                order.setConfirmedAt(LocalDateTime.now());
                orderRepository.save(order);
                log.info("Order {} status updated to CONFIRMED after payment", order.getId());
            }
        } else {
            // Direct checkout - need to create order from Stripe session
            log.info("No existing payment found, creating order from Stripe session: {}", sessionId);
            try {
                Session session = Session.retrieve(sessionId);

                if (!"complete".equals(session.getStatus())) {
                    log.warn("Session {} is not complete, status: {}", sessionId, session.getStatus());
                    throw new RuntimeException("Payment session is not complete");
                }

                createOrderFromStripeSession(session, userId);
            } catch (StripeException e) {
                log.error("Failed to retrieve Stripe session {}: {}", sessionId, e.getMessage());
                throw new RuntimeException("Failed to confirm payment: " + e.getMessage());
            }
        }
    }

    private void createOrderFromStripeSession(Session session, Long userIdFromContext) {
        Map<String, String> metadata = session.getMetadata();
        String sessionId = session.getId();

        // Check if order was already created (idempotency)
        if (paymentRepository.findByStripeSessionId(sessionId).isPresent()) {
            log.info("Order already exists for session {}, skipping creation", sessionId);
            return;
        }

        // Get user - try multiple sources
        User user = null;

        // 1. Try user ID from authentication context (most reliable)
        if (userIdFromContext != null) {
            user = userRepository.findById(userIdFromContext).orElse(null);
            if (user != null) {
                log.info("Found user from auth context: {}", user.getId());
            }
        }

        // 2. Try user ID from session metadata
        if (user == null && metadata != null && metadata.containsKey("user_id")) {
            try {
                Long userId = Long.parseLong(metadata.get("user_id"));
                user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    log.info("Found user from session metadata: {}", user.getId());
                }
            } catch (NumberFormatException e) {
                log.warn("Invalid user_id in metadata: {}", metadata.get("user_id"));
            }
        }

        // 3. Try to find user by email from Stripe session
        if (user == null && session.getCustomerEmail() != null) {
            user = userRepository.findByEmail(session.getCustomerEmail()).orElse(null);
            if (user != null) {
                log.info("Found user by Stripe customer email: {}", user.getEmail());
            }
        }

        if (user == null) {
            log.error("Cannot create order without user for session {}. No user found from context, metadata, or email.", sessionId);
            throw new RuntimeException("User not found for order creation. Please log in and try again.");
        }

        // Extract details from metadata
        String customerName = metadata != null ? metadata.getOrDefault("customer_name", user.getFullName()) : user.getFullName();
        String customerPhone = metadata != null ? metadata.getOrDefault("customer_phone", user.getPhone()) : user.getPhone();
        String deliveryAddress = metadata != null ? metadata.getOrDefault("delivery_address", "") : "";
        String notes = metadata != null ? metadata.get("notes") : null;

        // Determine order type based on delivery address
        OrderType orderType;
        if ("PICKUP".equals(deliveryAddress)) {
            orderType = OrderType.PICKUP;
        } else if ("DINE_IN".equals(deliveryAddress)) {
            orderType = OrderType.DINE_IN;
        } else {
            orderType = OrderType.DELIVERY;
        }

        // Get amount from session (in cents)
        BigDecimal totalAmount = BigDecimal.valueOf(session.getAmountTotal())
                .divide(BigDecimal.valueOf(100));

        // Calculate breakdown (reverse engineer from total)
        BigDecimal deliveryFee = orderType == OrderType.DELIVERY ? BigDecimal.valueOf(3.00) : BigDecimal.ZERO;
        BigDecimal amountWithoutDelivery = totalAmount.subtract(deliveryFee);
        // total = subtotal + serviceCharge = subtotal + (subtotal * 0.06) = subtotal * 1.06
        BigDecimal subtotal = amountWithoutDelivery.divide(BigDecimal.valueOf(1.06), 2, java.math.RoundingMode.HALF_UP);
        BigDecimal serviceCharge = amountWithoutDelivery.subtract(subtotal);

        // Create order
        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.CONFIRMED)
                .orderType(orderType)
                .subtotal(subtotal)
                .serviceCharge(serviceCharge)
                .deliveryFee(deliveryFee)
                .totalAmount(totalAmount)
                .notes(notes)
                .confirmedAt(LocalDateTime.now())
                .orderItems(new ArrayList<>())
                .build();

        order = orderRepository.save(order);
        log.info("Order created: ID={}, type={}, total={}", order.getId(), orderType, totalAmount);

        // Parse and create order items from metadata
        if (metadata != null && metadata.containsKey("item_count")) {
            int itemCount = Integer.parseInt(metadata.get("item_count"));
            List<OrderItem> orderItems = new ArrayList<>();

            for (int i = 0; i < itemCount; i++) {
                String itemData = metadata.get("item_" + i);
                if (itemData != null) {
                    String[] parts = itemData.split("\\|");
                    if (parts.length >= 3) {
                        String itemName = parts[0];
                        BigDecimal itemPrice = new BigDecimal(parts[1]);
                        int quantity = Integer.parseInt(parts[2]);

                        // Try to find matching menu item by name
                        Menu menu = menuRepository.findByName(itemName).orElse(null);

                        if (menu != null) {
                            OrderItem orderItem = OrderItem.builder()
                                    .order(order)
                                    .menu(menu)
                                    .quantity(quantity)
                                    .unitPrice(itemPrice)
                                    .subtotal(itemPrice.multiply(BigDecimal.valueOf(quantity)))
                                    .build();
                            orderItems.add(orderItem);
                            log.debug("Created order item: {} x{} @ {}", itemName, quantity, itemPrice);
                        } else {
                            log.warn("Menu item not found by name: {}", itemName);
                        }
                    }
                }
            }

            if (!orderItems.isEmpty()) {
                order.setOrderItems(orderItems);
                orderRepository.save(order);
                log.info("Added {} order items to order {}", orderItems.size(), order.getId());
            }
        }

        // Create payment record
        Payment payment = Payment.builder()
                .order(order)
                .stripeSessionId(sessionId)
                .stripePaymentIntentId(session.getPaymentIntent())
                .amount(totalAmount)
                .currency("MYR")
                .status(PaymentStatus.COMPLETED)
                .build();
        paymentRepository.save(payment);

        // Create delivery record if delivery order
        if (orderType == OrderType.DELIVERY && deliveryAddress != null && !deliveryAddress.isEmpty()) {
            boolean contactless = metadata != null && "true".equals(metadata.get("contactless"));
            Delivery delivery = Delivery.builder()
                    .order(order)
                    .deliveryAddress(deliveryAddress)
                    .status(DeliveryStatus.PENDING_ASSIGNMENT)
                    .contactless(contactless)
                    .build();
            deliveryRepository.save(delivery);
            log.info("Delivery record created for order: {}, contactless: {}", order.getId(), contactless);
        }

        // Send order confirmation email
        try {
            List<EmailService.OrderItemInfo> emailItems = new ArrayList<>();
            emailItems.add(new EmailService.OrderItemInfo(
                    "Your Order",
                    1,
                    subtotal,
                    subtotal
            ));

            emailService.sendOrderReceiptEmail(
                    user.getEmail(),
                    customerName,
                    order.getId(),
                    emailItems,
                    subtotal,
                    serviceCharge,
                    deliveryFee,
                    totalAmount,
                    orderType.name(),
                    deliveryAddress
            );
        } catch (Exception e) {
            log.error("Failed to send order receipt email for order {}: {}", order.getId(), e.getMessage());
        }
    }
}
