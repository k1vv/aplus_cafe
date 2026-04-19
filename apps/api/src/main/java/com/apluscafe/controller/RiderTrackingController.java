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

    // Shop location constant
    private static final double SHOP_LAT = 2.971129102928657;
    private static final double SHOP_LNG = 101.73187506821965;

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

        // Calculate progress percentage based on distance
        Double riderLat = rider.getCurrentLatitude();
        Double riderLng = rider.getCurrentLongitude();
        Double destLat = delivery.getDeliveryLatitude();
        Double destLng = delivery.getDeliveryLongitude();

        Integer progressPercent = null;
        if (riderLat != null && riderLng != null && destLat != null && destLng != null) {
            double totalDistance = calculateDistance(SHOP_LAT, SHOP_LNG, destLat, destLng);
            double remainingDistance = calculateDistance(riderLat, riderLng, destLat, destLng);

            if (totalDistance > 0) {
                double progress = ((totalDistance - remainingDistance) / totalDistance) * 100;
                progressPercent = (int) Math.max(0, Math.min(100, progress));
            }
        }

        // Check if this is SimBot
        boolean isSimBot = rider.getUser().getEmail().equals("simbot.rider@apluscafe.com");

        return ResponseEntity.ok(new RiderLocationData(
                riderLat,
                riderLng,
                rider.getUser().getFullName(),
                rider.getVehicleType(),
                delivery.getStatus().name(),
                SHOP_LAT,
                SHOP_LNG,
                destLat,
                destLng,
                progressPercent,
                isSimBot
        ));
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    private double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        double earthRadius = 6371; // km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }

    private void broadcastLocationUpdate(Long deliveryId, Double lat, Double lng) {
        broadcastToDelivery(deliveryId, lat, lng, null, null, null);
    }

    /**
     * Static method to broadcast rider location updates (used by simulation service)
     */
    public static void broadcastRiderLocation(Long deliveryId, Double lat, Double lng,
                                               String riderName, String vehicleType, String status) {
        CopyOnWriteArrayList<SseEmitter> emitters = deliveryTrackers.get(deliveryId);
        if (emitters != null && !emitters.isEmpty()) {
            RiderLocationData data = new RiderLocationData(lat, lng, riderName, vehicleType, status);

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

    private void broadcastToDelivery(Long deliveryId, Double lat, Double lng,
                                      String riderName, String vehicleType, String status) {
        CopyOnWriteArrayList<SseEmitter> emitters = deliveryTrackers.get(deliveryId);
        if (emitters != null && !emitters.isEmpty()) {
            Delivery delivery = deliveryRepository.findById(deliveryId).orElse(null);
            if (delivery == null || delivery.getRider() == null) return;

            RiderDetails rider = delivery.getRider();
            RiderLocationData data = new RiderLocationData(
                    lat, lng,
                    riderName != null ? riderName : rider.getUser().getFullName(),
                    vehicleType != null ? vehicleType : rider.getVehicleType(),
                    status != null ? status : delivery.getStatus().name()
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

    public record RiderLocationData(
            Double lat,
            Double lng,
            String riderName,
            String vehicleType,
            String deliveryStatus,
            Double shopLat,
            Double shopLng,
            Double destLat,
            Double destLng,
            Integer progressPercent,
            Boolean isSimulation
    ) {
        // Constructor for SSE broadcasts (backward compatible)
        public RiderLocationData(Double lat, Double lng, String riderName, String vehicleType, String deliveryStatus) {
            this(lat, lng, riderName, vehicleType, deliveryStatus, null, null, null, null, null, null);
        }
    }
}
