package com.apluscafe.controller;

import com.apluscafe.dto.response.OrderResponse;
import com.apluscafe.entity.Order;
import com.apluscafe.repository.OrderRepository;
import com.apluscafe.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderTrackingController {

    private final OrderRepository orderRepository;

    // Map of orderId -> list of SSE emitters for that order
    private static final Map<Long, CopyOnWriteArrayList<SseEmitter>> orderEmitters = new ConcurrentHashMap<>();

    // Map of userId -> list of SSE emitters for that user's orders
    private static final Map<Long, CopyOnWriteArrayList<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    /**
     * SSE endpoint for tracking a specific order
     */
    @GetMapping(value = "/{orderId}/track", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter trackOrder(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        log.info("SSE connection opened for order tracking: orderId={}, userId={}", orderId, userDetails.getId());

        // Verify order belongs to user
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUser().getId().equals(userDetails.getId())) {
            throw new RuntimeException("Order not found");
        }

        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE); // No timeout

        // Add to order-specific emitters
        orderEmitters.computeIfAbsent(orderId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        // Send initial order state
        try {
            OrderResponse response = OrderResponse.fromEntity(order);
            emitter.send(SseEmitter.event()
                    .name("order-update")
                    .data(response));
        } catch (IOException e) {
            log.error("Failed to send initial order state: {}", e.getMessage());
        }

        // Cleanup on completion/timeout/error
        emitter.onCompletion(() -> removeEmitter(orderId, emitter));
        emitter.onTimeout(() -> removeEmitter(orderId, emitter));
        emitter.onError(e -> removeEmitter(orderId, emitter));

        return emitter;
    }

    /**
     * SSE endpoint for tracking all orders of a user
     */
    @GetMapping(value = "/track", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter trackUserOrders(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long userId = userDetails.getId();
        log.info("SSE connection opened for user order tracking: userId={}", userId);

        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

        // Add to user emitters
        userEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        // Send current orders as initial state
        try {
            var orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
            for (Order order : orders) {
                OrderResponse response = OrderResponse.fromEntity(order);
                emitter.send(SseEmitter.event()
                        .name("order-update")
                        .data(response));
            }
        } catch (IOException e) {
            log.error("Failed to send initial orders state: {}", e.getMessage());
        }

        // Cleanup
        emitter.onCompletion(() -> removeUserEmitter(userId, emitter));
        emitter.onTimeout(() -> removeUserEmitter(userId, emitter));
        emitter.onError(e -> removeUserEmitter(userId, emitter));

        return emitter;
    }

    /**
     * Called when an order status changes to broadcast to connected clients
     */
    public static void broadcastOrderUpdate(Order order) {
        Long orderId = order.getId();
        Long userId = order.getUser().getId();

        log.debug("Broadcasting order update: orderId={}, status={}", orderId, order.getStatus());

        OrderResponse response = OrderResponse.fromEntity(order);

        // Broadcast to order-specific subscribers
        CopyOnWriteArrayList<SseEmitter> orderSpecificEmitters = orderEmitters.get(orderId);
        if (orderSpecificEmitters != null) {
            for (SseEmitter emitter : orderSpecificEmitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("order-update")
                            .data(response));
                } catch (IOException e) {
                    orderSpecificEmitters.remove(emitter);
                }
            }
        }

        // Broadcast to user-specific subscribers
        CopyOnWriteArrayList<SseEmitter> userSpecificEmitters = userEmitters.get(userId);
        if (userSpecificEmitters != null) {
            for (SseEmitter emitter : userSpecificEmitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("order-update")
                            .data(response));
                } catch (IOException e) {
                    userSpecificEmitters.remove(emitter);
                }
            }
        }
    }

    private void removeEmitter(Long orderId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = orderEmitters.get(orderId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                orderEmitters.remove(orderId);
            }
        }
        log.debug("SSE connection closed for order: {}", orderId);
    }

    private void removeUserEmitter(Long userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
            }
        }
        log.debug("SSE connection closed for user: {}", userId);
    }
}
