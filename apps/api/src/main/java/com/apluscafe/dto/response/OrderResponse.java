package com.apluscafe.dto.response;

import com.apluscafe.entity.Delivery;
import com.apluscafe.entity.Order;
import com.apluscafe.entity.OrderItem;
import com.apluscafe.enums.DeliveryStatus;
import com.apluscafe.enums.OrderStatus;
import com.apluscafe.enums.OrderType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private Long id;
    private OrderStatus status;
    private OrderType orderType;
    private BigDecimal subtotal;
    private BigDecimal serviceCharge;
    private BigDecimal deliveryFee;
    private BigDecimal totalAmount;
    private BigDecimal grandTotal; // Same as totalAmount, for frontend compatibility
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime preparingAt;
    private LocalDateTime readyAt;
    private LocalDateTime outForDeliveryAt; // Added for frontend compatibility
    private LocalDateTime deliveredAt;
    private Integer estimatedDeliveryMinutes; // Added for frontend compatibility
    private List<OrderItemResponse> orderItems; // Renamed from 'items' to match frontend

    // Customer info for admin panel
    private String customerName;
    private String customerEmail;

    public static OrderResponse fromEntity(Order order) {
        // Calculate estimated delivery minutes from delivery entity if available
        Integer estimatedMinutes = 45; // Default 45 minutes
        LocalDateTime outForDelivery = null;

        Delivery delivery = order.getDelivery();
        if (delivery != null) {
            if (delivery.getEstimatedDeliveryTime() != null && delivery.getAssignedAt() != null) {
                estimatedMinutes = (int) ChronoUnit.MINUTES.between(
                        delivery.getAssignedAt(),
                        delivery.getEstimatedDeliveryTime()
                );
            }
            // Map PICKED_UP or IN_TRANSIT status to outForDeliveryAt
            if (delivery.getStatus() == DeliveryStatus.PICKED_UP ||
                delivery.getStatus() == DeliveryStatus.IN_TRANSIT) {
                outForDelivery = delivery.getPickedUpAt();
            }
        }

        return OrderResponse.builder()
                .id(order.getId())
                .status(order.getStatus())
                .orderType(order.getOrderType())
                .subtotal(order.getSubtotal())
                .serviceCharge(order.getServiceCharge())
                .deliveryFee(order.getDeliveryFee())
                .totalAmount(order.getTotalAmount())
                .grandTotal(order.getTotalAmount()) // Same value for frontend compatibility
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .confirmedAt(order.getConfirmedAt())
                .preparingAt(order.getPreparingAt())
                .readyAt(order.getReadyAt())
                .outForDeliveryAt(outForDelivery)
                .deliveredAt(order.getDeliveredAt())
                .estimatedDeliveryMinutes(estimatedMinutes)
                .orderItems(order.getOrderItems().stream()
                        .map(OrderItemResponse::fromEntity)
                        .collect(Collectors.toList()))
                .customerName(order.getUser() != null ? order.getUser().getFullName() : null)
                .customerEmail(order.getUser() != null ? order.getUser().getEmail() : null)
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemResponse {
        private Long id;
        private Long menuId;
        private String menuName;
        private String itemName; // Added for frontend compatibility (same as menuName)
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal itemPrice; // Added for frontend compatibility (same as unitPrice)
        private BigDecimal subtotal;
        private String specialInstructions;

        public static OrderItemResponse fromEntity(OrderItem item) {
            return OrderItemResponse.builder()
                    .id(item.getId())
                    .menuId(item.getMenu().getId())
                    .menuName(item.getMenu().getName())
                    .itemName(item.getMenu().getName()) // Same value for frontend compatibility
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .itemPrice(item.getUnitPrice()) // Same value for frontend compatibility
                    .subtotal(item.getSubtotal())
                    .specialInstructions(item.getSpecialInstructions())
                    .build();
        }
    }
}
