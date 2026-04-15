package com.apluscafe.service;

import com.apluscafe.dto.response.CheckoutResponse;
import com.apluscafe.entity.Order;
import com.apluscafe.entity.Payment;
import com.apluscafe.enums.OrderStatus;
import com.apluscafe.enums.PaymentStatus;
import com.apluscafe.repository.OrderRepository;
import com.apluscafe.repository.PaymentRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

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
        log.debug("Webhook payload length: {}, signature header present: {}",
                payload != null ? payload.length() : 0, sigHeader != null);
        // Webhook handling will be implemented with actual Stripe webhook verification
        // For now, this is a placeholder
    }

    @Transactional
    public void confirmPayment(String sessionId) {
        log.info("Confirming payment for session: {}", sessionId);

        Payment payment = paymentRepository.findByStripeSessionId(sessionId)
                .orElseThrow(() -> {
                    log.error("Payment not found for session: {}", sessionId);
                    return new RuntimeException("Payment not found");
                });

        payment.setStatus(PaymentStatus.COMPLETED);
        paymentRepository.save(payment);
        log.info("Payment completed for order: {}, amount: {} {}",
                payment.getOrder().getId(), payment.getAmount(), payment.getCurrency());

        // Update order status
        Order order = payment.getOrder();
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);
        log.info("Order {} status updated to CONFIRMED after payment", order.getId());
    }
}
