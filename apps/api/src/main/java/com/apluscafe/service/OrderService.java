package com.apluscafe.service;

import com.apluscafe.dto.request.CreateOrderRequest;
import com.apluscafe.dto.response.OrderResponse;
import com.apluscafe.entity.*;
import com.apluscafe.enums.DeliveryStatus;
import com.apluscafe.enums.OrderStatus;
import com.apluscafe.enums.OrderType;
import com.apluscafe.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apluscafe.controller.OrderTrackingController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final MenuRepository menuRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final DeliveryRepository deliveryRepository;
    private final RiderDetailsRepository riderDetailsRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    private static final BigDecimal SERVICE_CHARGE_RATE = new BigDecimal("0.06"); // 6%
    private static final BigDecimal DELIVERY_FEE = new BigDecimal("5.00");

    @Transactional
    public OrderResponse createOrder(Long userId, CreateOrderRequest request) {
        log.info("Creating new order for user ID: {}, order type: {}", userId, request.getOrderType());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found when creating order: {}", userId);
                    return new RuntimeException("User not found");
                });

        Order order = new Order();
        order.setUser(user);
        order.setOrderType(request.getOrderType());
        order.setStatus(OrderStatus.PENDING);
        order.setNotes(request.getNotes());

        // Handle delivery address
        if (request.getOrderType() == OrderType.DELIVERY) {
            log.debug("Processing delivery order, address ID: {}", request.getAddressId());
            if (request.getAddressId() != null) {
                Address address = addressRepository.findById(request.getAddressId())
                        .orElseThrow(() -> {
                            log.error("Delivery address not found: {}", request.getAddressId());
                            return new RuntimeException("Address not found");
                        });
                order.setDeliveryAddress(address);
            }
        }

        // Calculate order items and subtotal
        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CreateOrderRequest.OrderItemRequest itemRequest : request.getItems()) {
            Menu menu = menuRepository.findById(itemRequest.getMenuId())
                    .orElseThrow(() -> {
                        log.error("Menu item not found: {}", itemRequest.getMenuId());
                        return new RuntimeException("Menu item not found: " + itemRequest.getMenuId());
                    });

            if (!menu.getIsAvailable()) {
                log.warn("Attempted to order unavailable menu item: {} (ID: {})", menu.getName(), menu.getId());
                throw new RuntimeException("Menu item not available: " + menu.getName());
            }
            log.debug("Adding item to order: {} x{}", menu.getName(), itemRequest.getQuantity());

            BigDecimal itemSubtotal = menu.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .menu(menu)
                    .quantity(itemRequest.getQuantity())
                    .unitPrice(menu.getPrice())
                    .subtotal(itemSubtotal)
                    .specialInstructions(itemRequest.getSpecialInstructions())
                    .build();

            orderItems.add(orderItem);
            subtotal = subtotal.add(itemSubtotal);
        }

        order.setSubtotal(subtotal);
        order.setServiceCharge(subtotal.multiply(SERVICE_CHARGE_RATE));

        if (request.getOrderType() == OrderType.DELIVERY) {
            order.setDeliveryFee(DELIVERY_FEE);
        } else {
            order.setDeliveryFee(BigDecimal.ZERO);
        }

        order.setTotalAmount(order.getSubtotal()
                .add(order.getServiceCharge())
                .add(order.getDeliveryFee()));

        order.setOrderItems(orderItems);
        order = orderRepository.save(order);
        log.info("Order created successfully - ID: {}, Total: {}, Items: {}",
                order.getId(), order.getTotalAmount(), orderItems.size());

        // Create delivery record if delivery order
        if (request.getOrderType() == OrderType.DELIVERY) {
            createDeliveryForOrder(order, request.getDeliveryDetails());
        }

        // Send order receipt email
        sendOrderReceiptEmail(user, order, orderItems);

        return OrderResponse.fromEntity(order);
    }

    private void sendOrderReceiptEmail(User user, Order order, List<OrderItem> orderItems) {
        try {
            List<EmailService.OrderItemInfo> itemInfos = orderItems.stream()
                    .map(item -> new EmailService.OrderItemInfo(
                            item.getMenu().getName(),
                            item.getQuantity(),
                            item.getUnitPrice(),
                            item.getSubtotal()))
                    .toList();

            String deliveryAddress = order.getDeliveryAddress() != null
                    ? order.getDeliveryAddress().getAddressLine()
                    : "";

            emailService.sendOrderReceiptEmail(
                    user.getEmail(),
                    user.getFullName(),
                    order.getId(),
                    itemInfos,
                    order.getSubtotal(),
                    order.getServiceCharge(),
                    order.getDeliveryFee(),
                    order.getTotalAmount(),
                    order.getOrderType().name(),
                    deliveryAddress
            );
            log.info("Order receipt email sent for order ID: {}", order.getId());
        } catch (Exception e) {
            log.error("Failed to send order receipt email for order ID: {}", order.getId(), e);
        }
    }

    private void createDeliveryForOrder(Order order, CreateOrderRequest.DeliveryDetailsRequest deliveryDetails) {
        log.debug("Creating delivery record for order ID: {}", order.getId());

        String address = order.getDeliveryAddress() != null
                ? order.getDeliveryAddress().getAddressLine()
                : (deliveryDetails != null ? deliveryDetails.getAddress() : "");

        Boolean contactless = deliveryDetails != null && deliveryDetails.getContactless() != null
                ? deliveryDetails.getContactless()
                : false;

        Delivery delivery = Delivery.builder()
                .order(order)
                .deliveryAddress(address)
                .status(DeliveryStatus.PENDING_ASSIGNMENT)
                .deliveryNotes(deliveryDetails != null ? deliveryDetails.getNotes() : null)
                .contactless(contactless)
                .build();

        deliveryRepository.save(delivery);
        log.info("Delivery record created for order ID: {}, status: PENDING_ASSIGNMENT, contactless: {}", order.getId(), contactless);
    }

    public List<OrderResponse> getUserOrders(Long userId) {
        log.debug("Fetching orders for user ID: {}", userId);
        List<OrderResponse> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(OrderResponse::fromEntity)
                .collect(Collectors.toList());
        log.debug("Found {} orders for user ID: {}", orders.size(), userId);
        return orders;
    }

    public OrderResponse getOrder(Long orderId, Long userId) {
        log.debug("Fetching order ID: {} for user ID: {}", orderId, userId);

        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> {
                    log.warn("Order not found: {}", orderId);
                    return new RuntimeException("Order not found");
                });

        if (!order.getUser().getId().equals(userId)) {
            log.warn("User {} attempted to access order {} belonging to user {}",
                    userId, orderId, order.getUser().getId());
            throw new RuntimeException("Order not found");
        }

        return OrderResponse.fromEntity(order);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus status) {
        log.info("Updating order {} status to: {}", orderId, status);

        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> {
                    log.error("Order not found for status update: {}", orderId);
                    return new RuntimeException("Order not found");
                });

        OrderStatus previousStatus = order.getStatus();
        order.setStatus(status);

        switch (status) {
            case CONFIRMED -> order.setConfirmedAt(LocalDateTime.now());
            case PREPARING -> order.setPreparingAt(LocalDateTime.now());
            case READY_FOR_PICKUP -> order.setReadyAt(LocalDateTime.now());
            case DELIVERED -> order.setDeliveredAt(LocalDateTime.now());
        }
        log.debug("Order {} status changed: {} -> {}", orderId, previousStatus, status);

        // Auto-assign rider when order is confirmed for delivery
        if (status == OrderStatus.CONFIRMED && order.getOrderType() == OrderType.DELIVERY) {
            log.debug("Triggering auto-assign rider for delivery order: {}", orderId);
            autoAssignRider(order);
        }

        order = orderRepository.save(order);
        log.info("Order {} status updated successfully to: {}", orderId, status);

        // Broadcast real-time update to connected clients
        OrderTrackingController.broadcastOrderUpdate(order);

        // Send push notification
        notificationService.sendOrderStatusNotification(order, status);

        return OrderResponse.fromEntity(order);
    }

    private void autoAssignRider(Order order) {
        log.debug("Auto-assigning rider for order: {}", order.getId());

        Delivery delivery = deliveryRepository.findByOrderId(order.getId())
                .orElse(null);

        if (delivery == null) {
            log.warn("No delivery record found for order: {}", order.getId());
            return;
        }

        if (delivery.getRider() != null) {
            log.debug("Rider already assigned to order: {}", order.getId());
            return;
        }

        // Find available rider with least workload
        List<RiderDetails> availableRiders = riderDetailsRepository.findAvailableRidersOrderByWorkloadAndRating();
        log.debug("Found {} available riders", availableRiders.size());

        if (!availableRiders.isEmpty()) {
            RiderDetails rider = availableRiders.get(0);
            delivery.setRider(rider);
            delivery.setStatus(DeliveryStatus.ASSIGNED);
            delivery.setAssignedAt(LocalDateTime.now());
            delivery.setEstimatedDeliveryTime(LocalDateTime.now().plusMinutes(45));
            deliveryRepository.save(delivery);
            log.info("Rider {} assigned to order {}, ETA: 45 minutes",
                    rider.getUser().getFullName(), order.getId());
        } else {
            log.warn("No available riders for order: {}", order.getId());
        }
    }

    public List<OrderResponse> getActiveOrders() {
        log.debug("Fetching all active orders");
        List<OrderResponse> orders = orderRepository.findActiveOrders().stream()
                .map(OrderResponse::fromEntity)
                .collect(Collectors.toList());
        log.debug("Found {} active orders", orders.size());
        return orders;
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId, Long userId) {
        log.info("Cancelling order {} for user {}", orderId, userId);

        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> {
                    log.error("Order not found for cancellation: {}", orderId);
                    return new RuntimeException("Order not found");
                });

        // Verify ownership
        if (!order.getUser().getId().equals(userId)) {
            log.warn("User {} attempted to cancel order {} belonging to user {}",
                    userId, orderId, order.getUser().getId());
            throw new RuntimeException("Order not found");
        }

        // Only allow cancellation of pending or confirmed orders
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            log.warn("Cannot cancel order {} with status {}", orderId, order.getStatus());
            throw new RuntimeException("Cannot cancel order - it's already being prepared or delivered");
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        order = orderRepository.save(order);

        // Cancel delivery if exists
        deliveryRepository.findByOrderId(orderId).ifPresent(delivery -> {
            delivery.setStatus(DeliveryStatus.CANCELLED);
            deliveryRepository.save(delivery);
        });

        log.info("Order {} cancelled successfully", orderId);
        return OrderResponse.fromEntity(order);
    }
}
