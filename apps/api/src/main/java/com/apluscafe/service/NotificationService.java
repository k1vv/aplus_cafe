package com.apluscafe.service;

import com.apluscafe.entity.Order;
import com.apluscafe.entity.PushSubscription;
import com.apluscafe.enums.OrderStatus;
import com.apluscafe.repository.PushSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final PushSubscriptionRepository subscriptionRepository;
    private final EmailService emailService;

    /**
     * Send order status update notification via email and push (if available)
     */
    @Async
    public void sendOrderStatusNotification(Order order, OrderStatus newStatus) {
        Long userId = order.getUser().getId();
        String userEmail = order.getUser().getEmail();
        String userName = order.getUser().getFullName();

        String title = getNotificationTitle(newStatus);
        String body = getNotificationBody(order, newStatus);

        // Send email notification for important status updates
        try {
            // Skip sending email for PENDING status (receipt already sent separately)
            if (newStatus != OrderStatus.PENDING) {
                emailService.sendOrderStatusEmail(
                    userEmail,
                    userName,
                    order.getId(),
                    newStatus.name(),
                    body
                );
                log.info("Order status email sent to user {} for order {} - status: {}",
                        userId, order.getId(), newStatus);
            }
        } catch (Exception e) {
            log.error("Failed to send order status email to user {}: {}", userId, e.getMessage());
        }

        // Also try push notifications if user has subscriptions
        List<PushSubscription> subscriptions = subscriptionRepository.findByUserId(userId);

        if (!subscriptions.isEmpty()) {
            for (PushSubscription subscription : subscriptions) {
                try {
                    // Log for now - web push requires VAPID keys setup
                    log.debug("Push notification queued for user {}: {} - {}",
                            userId, title, body);
                } catch (Exception e) {
                    log.error("Failed to send push notification: {}", e.getMessage());
                }
            }
        }
    }

    /**
     * Send delivery update notification
     */
    @Async
    public void sendDeliveryNotification(Order order, String message) {
        Long userId = order.getUser().getId();
        List<PushSubscription> subscriptions = subscriptionRepository.findByUserId(userId);

        if (subscriptions.isEmpty()) {
            return;
        }

        for (PushSubscription subscription : subscriptions) {
            try {
                log.info("Would send delivery notification to user {}: Order #{} - {}",
                        userId, order.getId(), message);
            } catch (Exception e) {
                log.error("Failed to send delivery notification: {}", e.getMessage());
            }
        }
    }

    private String getNotificationTitle(OrderStatus status) {
        return switch (status) {
            case CONFIRMED -> "Order Confirmed!";
            case PREPARING -> "Preparing Your Order";
            case READY_FOR_PICKUP -> "Order Ready!";
            case OUT_FOR_DELIVERY -> "On The Way!";
            case DELIVERED -> "Order Delivered";
            case CANCELLED -> "Order Cancelled";
            default -> "Order Update";
        };
    }

    private String getNotificationBody(Order order, OrderStatus status) {
        String orderId = "Order #" + order.getId();
        return switch (status) {
            case CONFIRMED -> orderId + " has been confirmed and will be prepared soon.";
            case PREPARING -> "Our chefs are preparing your order. Sit tight!";
            case READY_FOR_PICKUP -> orderId + " is ready for pickup!";
            case OUT_FOR_DELIVERY -> "Your rider is on the way with your order!";
            case DELIVERED -> orderId + " has been delivered. Enjoy your meal!";
            case CANCELLED -> orderId + " has been cancelled.";
            default -> orderId + " status updated.";
        };
    }
}
