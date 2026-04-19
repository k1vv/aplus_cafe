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
    private final RiderSimulationService riderSimulationService;

    private static final BigDecimal SERVICE_CHARGE_RATE = new BigDecimal("0.06"); // 6%
    private static final BigDecimal DELIVERY_FEE = new BigDecimal("3.00"); // RM 3 delivery fee

    // Shop location constants for delivery range validation
    private static final double SHOP_LAT = 2.971129102928657;
    private static final double SHOP_LNG = 101.73187506821965;
    private static final double MAX_DELIVERY_RADIUS_KM = 20.0;

    /**
     * Calculate distance between two points using Haversine formula
     * @return distance in kilometers
     */
    private double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371; // Earth's radius in kilometers
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Validate delivery location is within range
     */
    private void validateDeliveryRange(Double lat, Double lng) {
        if (lat == null || lng == null) {
            return; // Skip validation if coordinates not provided
        }
        double distance = calculateDistanceKm(SHOP_LAT, SHOP_LNG, lat, lng);
        if (distance > MAX_DELIVERY_RADIUS_KM) {
            log.warn("Delivery location out of range: {} km (max: {} km)",
                    String.format("%.2f", distance), MAX_DELIVERY_RADIUS_KM);
            throw new RuntimeException(String.format(
                "Delivery location is %.1f km away. Maximum delivery range is %.0f km.",
                distance, MAX_DELIVERY_RADIUS_KM));
        }
        log.debug("Delivery location within range: {} km", String.format("%.2f", distance));
    }

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

        // Get coordinates - try multiple sources
        Double deliveryLat = null;
        Double deliveryLng = null;

        // 1. Try from saved Address entity
        if (order.getDeliveryAddress() != null) {
            deliveryLat = order.getDeliveryAddress().getLatitude();
            deliveryLng = order.getDeliveryAddress().getLongitude();
            if (deliveryLat != null && deliveryLng != null) {
                log.debug("Using coordinates from saved address: [{}, {}]", deliveryLat, deliveryLng);
            }
        }

        // 2. Try to parse from address string format: "address [lat, lng]"
        if ((deliveryLat == null || deliveryLng == null) &&
            address != null && address.contains("[") && address.contains("]")) {
            try {
                String coords = address.substring(
                    address.lastIndexOf("[") + 1,
                    address.lastIndexOf("]")
                );
                String[] parts = coords.split(",");
                if (parts.length >= 2) {
                    deliveryLat = Double.parseDouble(parts[0].trim());
                    deliveryLng = Double.parseDouble(parts[1].trim());
                    log.debug("Parsed coordinates from address string: [{}, {}]", deliveryLat, deliveryLng);
                }
            } catch (Exception e) {
                log.warn("Failed to parse coordinates from address string: {}", e.getMessage());
            }
        }

        // 3. Fallback to user's saved delivery location
        if (deliveryLat == null || deliveryLng == null) {
            User user = order.getUser();
            if (user.getDeliveryLat() != null && user.getDeliveryLng() != null) {
                deliveryLat = user.getDeliveryLat();
                deliveryLng = user.getDeliveryLng();
                log.debug("Using user's saved delivery location: [{}, {}]", deliveryLat, deliveryLng);
            }
        }

        // Validate delivery range
        validateDeliveryRange(deliveryLat, deliveryLng);

        Delivery delivery = Delivery.builder()
                .order(order)
                .deliveryAddress(address)
                .deliveryLatitude(deliveryLat)
                .deliveryLongitude(deliveryLng)
                .status(DeliveryStatus.PENDING_ASSIGNMENT)
                .deliveryNotes(deliveryDetails != null ? deliveryDetails.getNotes() : null)
                .contactless(contactless)
                .build();

        deliveryRepository.save(delivery);
        log.info("Delivery record created for order ID: {}, coords: [{}, {}], contactless: {}",
                order.getId(), deliveryLat, deliveryLng, contactless);
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
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus status, String cancellationReason) {
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
            case OUT_FOR_DELIVERY -> {
                // Update delivery status when order goes out for delivery
                deliveryRepository.findByOrderId(orderId).ifPresent(delivery -> {
                    delivery.setStatus(DeliveryStatus.IN_TRANSIT);
                    delivery.setPickedUpAt(LocalDateTime.now());
                    deliveryRepository.save(delivery);

                    // Start SimBot simulation if SimBot is assigned
                    if (delivery.getRider() != null && riderSimulationService.isSimBot(delivery.getRider())) {
                        log.info("Starting SimBot simulation for order {} (status changed to OUT_FOR_DELIVERY)", orderId);
                        riderSimulationService.startSimulation(delivery.getId());
                    }
                });
            }
            case DELIVERED -> {
                order.setDeliveredAt(LocalDateTime.now());
                // Update delivery status
                deliveryRepository.findByOrderId(orderId).ifPresent(delivery -> {
                    delivery.setStatus(DeliveryStatus.DELIVERED);
                    delivery.setActualDeliveryTime(LocalDateTime.now());
                    deliveryRepository.save(delivery);
                });
            }
            case CANCELLED -> {
                order.setCancelledAt(LocalDateTime.now());
                order.setCancellationReason(cancellationReason);
                // Cancel delivery if exists
                deliveryRepository.findByOrderId(orderId).ifPresent(delivery -> {
                    delivery.setStatus(DeliveryStatus.CANCELLED);
                    deliveryRepository.save(delivery);
                });
            }
        }
        log.debug("Order {} status changed: {} -> {}", orderId, previousStatus, status);

        order = orderRepository.save(order);
        log.info("Order {} status updated successfully to: {}", orderId, status);

        // Broadcast real-time update to connected clients
        OrderTrackingController.broadcastOrderUpdate(order);

        // Send push notification
        notificationService.sendOrderStatusNotification(order, status);

        return OrderResponse.fromEntity(order);
    }

    public List<OrderResponse> getActiveOrders() {
        log.debug("Fetching all active orders");
        List<OrderResponse> orders = orderRepository.findActiveOrders().stream()
                .map(OrderResponse::fromEntity)
                .collect(Collectors.toList());
        log.debug("Found {} active orders", orders.size());
        return orders;
    }

    public List<OrderResponse> getAllOrders() {
        log.debug("Fetching all orders (including delivered and cancelled)");
        List<OrderResponse> orders = orderRepository.findAllOrdersWithDetails().stream()
                .map(OrderResponse::fromEntity)
                .collect(Collectors.toList());
        log.debug("Found {} total orders", orders.size());
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
