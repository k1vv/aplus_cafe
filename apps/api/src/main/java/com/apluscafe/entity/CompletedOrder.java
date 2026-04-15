package com.apluscafe.entity;

import com.apluscafe.enums.OrderType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "completed_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompletedOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long originalOrderId;

    @Column(nullable = false)
    private Long userId;

    private String userEmail;

    private String userName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderType orderType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(precision = 10, scale = 2)
    private BigDecimal serviceCharge;

    @Column(precision = 10, scale = 2)
    private BigDecimal deliveryFee;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    private String deliveryAddress;

    @Column(columnDefinition = "TEXT")
    private String orderItemsJson; // JSON snapshot of order items

    private LocalDateTime orderCreatedAt;

    private LocalDateTime completedAt;

    private String paymentMethod;

    private String stripePaymentIntentId;

    private Long riderId;

    private String riderName;
}
