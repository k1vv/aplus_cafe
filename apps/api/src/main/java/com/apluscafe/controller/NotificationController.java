package com.apluscafe.controller;

import com.apluscafe.entity.PushSubscription;
import com.apluscafe.entity.User;
import com.apluscafe.repository.PushSubscriptionRepository;
import com.apluscafe.repository.UserRepository;
import com.apluscafe.security.UserDetailsImpl;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final PushSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    @Value("${push.vapid-public-key:}")
    private String vapidPublicKey;

    /**
     * Get VAPID public key for push subscription
     */
    @GetMapping("/vapid-public-key")
    public ResponseEntity<Map<String, String>> getVapidPublicKey() {
        return ResponseEntity.ok(Map.of("publicKey", vapidPublicKey));
    }

    /**
     * Subscribe to push notifications
     */
    @PostMapping("/subscribe")
    @Transactional
    public ResponseEntity<Map<String, String>> subscribe(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody SubscriptionRequest request) {

        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if subscription already exists
        var existing = subscriptionRepository.findByUserIdAndEndpoint(user.getId(), request.getEndpoint());
        if (existing.isPresent()) {
            // Update existing subscription
            PushSubscription subscription = existing.get();
            subscription.setP256dhKey(request.getKeys().getP256dh());
            subscription.setAuthKey(request.getKeys().getAuth());
            subscriptionRepository.save(subscription);
            log.info("Updated push subscription for user: {}", user.getId());
        } else {
            // Create new subscription
            PushSubscription subscription = PushSubscription.builder()
                    .user(user)
                    .endpoint(request.getEndpoint())
                    .p256dhKey(request.getKeys().getP256dh())
                    .authKey(request.getKeys().getAuth())
                    .build();
            subscriptionRepository.save(subscription);
            log.info("Created push subscription for user: {}", user.getId());
        }

        return ResponseEntity.ok(Map.of("message", "Subscribed to push notifications"));
    }

    /**
     * Unsubscribe from push notifications
     */
    @PostMapping("/unsubscribe")
    @Transactional
    public ResponseEntity<Map<String, String>> unsubscribe(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody UnsubscribeRequest request) {

        subscriptionRepository.deleteByUserIdAndEndpoint(userDetails.getId(), request.getEndpoint());
        log.info("Removed push subscription for user: {}", userDetails.getId());

        return ResponseEntity.ok(Map.of("message", "Unsubscribed from push notifications"));
    }

    /**
     * Check if user has push subscription
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSubscriptionStatus(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        var subscriptions = subscriptionRepository.findByUserId(userDetails.getId());
        return ResponseEntity.ok(Map.of(
                "subscribed", !subscriptions.isEmpty(),
                "count", subscriptions.size()
        ));
    }

    @Data
    static class SubscriptionRequest {
        private String endpoint;
        private Keys keys;

        @Data
        static class Keys {
            private String p256dh;
            private String auth;
        }
    }

    @Data
    static class UnsubscribeRequest {
        private String endpoint;
    }
}
