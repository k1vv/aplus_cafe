package com.apluscafe.controller;

import com.apluscafe.entity.Delivery;
import com.apluscafe.entity.RiderDetails;
import com.apluscafe.repository.DeliveryRepository;
import com.apluscafe.repository.RiderDetailsRepository;
import com.apluscafe.security.UserDetailsImpl;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RiderTrackingController {

    private final DeliveryRepository deliveryRepository;
    private final RiderDetailsRepository riderDetailsRepository;

    // Map of deliveryId -> list of SSE emitters watching that delivery
    private static final Map<Long, CopyOnWriteArrayList<SseEmitter>> deliveryTrackers = new ConcurrentHashMap<>();

    /**
     * Rider updates their current location
     */
    @PostMapping("/rider/location")
    @PreAuthorize("hasRole('RIDER')")
    public ResponseEntity<Void> updateRiderLocation(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody LocationUpdate location) {

        RiderDetails rider = riderDetailsRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Rider not found"));

        rider.setCurrentLatitude(location.getLat());
        rider.setCurrentLongitude(location.getLng());
        riderDetailsRepository.save(rider);

        log.debug("Rider {} location updated: [{}, {}]", rider.getId(), location.getLat(), location.getLng());

        // Broadcast to all active deliveries for this rider
        for (Delivery delivery : rider.getDeliveries()) {
            if (delivery.getStatus().isActive()) {
                broadcastLocationUpdate(delivery.getId(), location.getLat(), location.getLng());
            }
        }

        return ResponseEntity.ok().build();
    }

    /**
     * Customer tracks rider location for their delivery via SSE
     */
    @GetMapping(value = "/orders/{orderId}/rider-location", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter trackRiderLocation(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Delivery not found"));

        // Verify ownership
        if (!delivery.getOrder().getUser().getId().equals(userDetails.getId())) {
            throw new RuntimeException("Delivery not found");
        }

        log.info("SSE connection opened for rider tracking: orderId={}, userId={}", orderId, userDetails.getId());

        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

        // Add to delivery trackers
        deliveryTrackers.computeIfAbsent(delivery.getId(), k -> new CopyOnWriteArrayList<>()).add(emitter);

        // Send initial rider location if available
        if (delivery.getRider() != null) {
            RiderDetails rider = delivery.getRider();
            if (rider.getCurrentLatitude() != null && rider.getCurrentLongitude() != null) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("rider-location")
                            .data(new RiderLocationData(
                                    rider.getCurrentLatitude(),
                                    rider.getCurrentLongitude(),
                                    rider.getUser().getFullName(),
                                    rider.getVehicleType(),
                                    delivery.getStatus().name()
                            )));
                } catch (IOException e) {
                    log.error("Failed to send initial rider location: {}", e.getMessage());
                }
            }
        }

        // Cleanup
        emitter.onCompletion(() -> removeTracker(delivery.getId(), emitter));
        emitter.onTimeout(() -> removeTracker(delivery.getId(), emitter));
        emitter.onError(e -> removeTracker(delivery.getId(), emitter));

        return emitter;
    }

    /**
     * Get current rider location (polling fallback)
     */
    @GetMapping("/orders/{orderId}/rider-location/current")
    public ResponseEntity<RiderLocationData> getCurrentRiderLocation(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Delivery not found"));

        // Verify ownership
        if (!delivery.getOrder().getUser().getId().equals(userDetails.getId())) {
            throw new RuntimeException("Delivery not found");
        }

        if (delivery.getRider() == null) {
            return ResponseEntity.ok(null);
        }

        RiderDetails rider = delivery.getRider();
        return ResponseEntity.ok(new RiderLocationData(
                rider.getCurrentLatitude(),
                rider.getCurrentLongitude(),
                rider.getUser().getFullName(),
                rider.getVehicleType(),
                delivery.getStatus().name()
        ));
    }

    private void broadcastLocationUpdate(Long deliveryId, Double lat, Double lng) {
        CopyOnWriteArrayList<SseEmitter> emitters = deliveryTrackers.get(deliveryId);
        if (emitters != null && !emitters.isEmpty()) {
            Delivery delivery = deliveryRepository.findById(deliveryId).orElse(null);
            if (delivery == null || delivery.getRider() == null) return;

            RiderDetails rider = delivery.getRider();
            RiderLocationData data = new RiderLocationData(
                    lat, lng,
                    rider.getUser().getFullName(),
                    rider.getVehicleType(),
                    delivery.getStatus().name()
            );

            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("rider-location")
                            .data(data));
                } catch (IOException e) {
                    emitters.remove(emitter);
                }
            }
        }
    }

    private void removeTracker(Long deliveryId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = deliveryTrackers.get(deliveryId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                deliveryTrackers.remove(deliveryId);
            }
        }
    }

    @Data
    static class LocationUpdate {
        private Double lat;
        private Double lng;
    }

    public record RiderLocationData(
            Double lat,
            Double lng,
            String riderName,
            String vehicleType,
            String deliveryStatus
    ) {}
}
