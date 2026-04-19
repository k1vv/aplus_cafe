package com.apluscafe.controller;

import com.apluscafe.entity.Delivery;
import com.apluscafe.entity.RiderDetails;
import com.apluscafe.enums.DeliveryStatus;
import com.apluscafe.enums.OrderStatus;
import com.apluscafe.repository.DeliveryRepository;
import com.apluscafe.repository.RiderDetailsRepository;
import com.apluscafe.security.UserDetailsImpl;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/rider")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RIDER')")
public class RiderController {

    private final RiderDetailsRepository riderDetailsRepository;
    private final DeliveryRepository deliveryRepository;

    /**
     * Get rider's profile info
     */
    @GetMapping("/profile")
    public ResponseEntity<RiderProfileResponse> getProfile(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        RiderDetails rider = riderDetailsRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Rider profile not found"));

        return ResponseEntity.ok(RiderProfileResponse.fromEntity(rider));
    }

    /**
     * Get rider's assigned deliveries
     */
    @GetMapping("/deliveries")
    public ResponseEntity<List<DeliveryResponse>> getMyDeliveries(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        RiderDetails rider = riderDetailsRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Rider profile not found"));

        List<Delivery> deliveries = deliveryRepository.findByRiderIdOrderByCreatedAtDesc(rider.getId());

        List<DeliveryResponse> response = deliveries.stream()
                .map(DeliveryResponse::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Get active delivery (currently assigned and not delivered)
     */
    @GetMapping("/deliveries/active")
    public ResponseEntity<DeliveryResponse> getActiveDelivery(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        RiderDetails rider = riderDetailsRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Rider profile not found"));

        Delivery activeDelivery = deliveryRepository.findByRiderIdAndStatusIn(
                rider.getId(),
                List.of(DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT)
        ).stream().findFirst().orElse(null);

        if (activeDelivery == null) {
            return ResponseEntity.ok(null);
        }

        return ResponseEntity.ok(DeliveryResponse.fromEntity(activeDelivery));
    }

    /**
     * Update rider's current location
     */
    @PostMapping("/location")
    public ResponseEntity<Map<String, String>> updateLocation(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody LocationUpdate location) {

        RiderDetails rider = riderDetailsRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Rider profile not found"));

        rider.setCurrentLatitude(location.getLat());
        rider.setCurrentLongitude(location.getLng());
        riderDetailsRepository.save(rider);

        log.debug("Rider {} location updated: [{}, {}]", rider.getId(), location.getLat(), location.getLng());

        // Broadcast to customers tracking this rider's active deliveries
        for (Delivery delivery : rider.getDeliveries()) {
            if (delivery.getStatus().isActive()) {
                RiderTrackingController.broadcastRiderLocation(
                        delivery.getId(),
                        location.getLat(),
                        location.getLng(),
                        rider.getUser().getFullName(),
                        rider.getVehicleType(),
                        delivery.getStatus().name()
                );
            }
        }

        return ResponseEntity.ok(Map.of("message", "Location updated"));
    }

    /**
     * Update delivery status
     */
    @PatchMapping("/deliveries/{deliveryId}/status")
    public ResponseEntity<DeliveryResponse> updateDeliveryStatus(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long deliveryId,
            @RequestBody StatusUpdate statusUpdate) {

        RiderDetails rider = riderDetailsRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Rider profile not found"));

        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Delivery not found"));

        // Verify this delivery is assigned to this rider
        if (delivery.getRider() == null || !delivery.getRider().getId().equals(rider.getId())) {
            throw new RuntimeException("This delivery is not assigned to you");
        }

        DeliveryStatus newStatus = DeliveryStatus.valueOf(statusUpdate.getStatus());
        delivery.setStatus(newStatus);

        // Update timestamps based on status
        switch (newStatus) {
            case PICKED_UP:
                delivery.setPickedUpAt(LocalDateTime.now());
                // Update order status to OUT_FOR_DELIVERY
                if (delivery.getOrder().getStatus() != OrderStatus.OUT_FOR_DELIVERY) {
                    delivery.getOrder().setStatus(OrderStatus.OUT_FOR_DELIVERY);
                    log.info("Order {} status updated to OUT_FOR_DELIVERY by rider", delivery.getOrder().getId());
                }
                break;
            case IN_TRANSIT:
                // Already picked up, now in transit - ensure order is OUT_FOR_DELIVERY
                if (delivery.getOrder().getStatus() != OrderStatus.OUT_FOR_DELIVERY) {
                    delivery.getOrder().setStatus(OrderStatus.OUT_FOR_DELIVERY);
                }
                break;
            case DELIVERED:
                delivery.setActualDeliveryTime(LocalDateTime.now());
                // Update order status as well
                delivery.getOrder().setStatus(OrderStatus.DELIVERED);
                delivery.getOrder().setDeliveredAt(LocalDateTime.now());
                // Increment rider's total deliveries
                rider.setTotalDeliveries(rider.getTotalDeliveries() + 1);
                riderDetailsRepository.save(rider);
                log.info("Order {} status updated to DELIVERED by rider", delivery.getOrder().getId());
                break;
            case CANCELLED:
                // Handle cancellation
                break;
        }

        delivery = deliveryRepository.save(delivery);
        log.info("Rider {} updated delivery {} status to {}", rider.getId(), deliveryId, newStatus);

        return ResponseEntity.ok(DeliveryResponse.fromEntity(delivery));
    }

    /**
     * Toggle rider availability
     */
    @PostMapping("/availability")
    public ResponseEntity<Map<String, Object>> toggleAvailability(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody Map<String, Boolean> request) {

        RiderDetails rider = riderDetailsRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Rider profile not found"));

        Boolean isAvailable = request.get("isAvailable");
        if (isAvailable != null) {
            rider.setIsAvailable(isAvailable);
            riderDetailsRepository.save(rider);
        }

        return ResponseEntity.ok(Map.of(
                "isAvailable", rider.getIsAvailable(),
                "message", rider.getIsAvailable() ? "You are now available for deliveries" : "You are now offline"
        ));
    }

    // ==================== DTOs ====================

    @Data
    static class LocationUpdate {
        private Double lat;
        private Double lng;
    }

    @Data
    static class StatusUpdate {
        private String status;
    }

    @Data
    public static class RiderProfileResponse {
        private Long id;
        private String name;
        private String email;
        private String vehicleType;
        private String licensePlate;
        private Boolean isAvailable;
        private Double currentLatitude;
        private Double currentLongitude;
        private Double rating;
        private Integer totalDeliveries;

        public static RiderProfileResponse fromEntity(RiderDetails rider) {
            RiderProfileResponse response = new RiderProfileResponse();
            response.setId(rider.getId());
            response.setName(rider.getUser().getFullName());
            response.setEmail(rider.getUser().getEmail());
            response.setVehicleType(rider.getVehicleType());
            response.setLicensePlate(rider.getLicensePlate());
            response.setIsAvailable(rider.getIsAvailable());
            response.setCurrentLatitude(rider.getCurrentLatitude());
            response.setCurrentLongitude(rider.getCurrentLongitude());
            response.setRating(rider.getRating());
            response.setTotalDeliveries(rider.getTotalDeliveries());
            return response;
        }
    }

    @Data
    public static class DeliveryResponse {
        private Long id;
        private Long orderId;
        private String status;
        private String deliveryAddress;
        private Double deliveryLatitude;
        private Double deliveryLongitude;
        private String customerName;
        private String customerPhone;
        private String deliveryNotes;
        private Boolean contactless;
        private LocalDateTime assignedAt;
        private LocalDateTime estimatedDeliveryTime;
        private List<OrderItemInfo> orderItems;
        private Double orderTotal;

        public static DeliveryResponse fromEntity(Delivery delivery) {
            DeliveryResponse response = new DeliveryResponse();
            response.setId(delivery.getId());
            response.setOrderId(delivery.getOrder().getId());
            response.setStatus(delivery.getStatus().name());
            response.setDeliveryAddress(delivery.getDeliveryAddress());
            response.setDeliveryLatitude(delivery.getDeliveryLatitude());
            response.setDeliveryLongitude(delivery.getDeliveryLongitude());
            response.setCustomerName(delivery.getOrder().getUser() != null
                    ? delivery.getOrder().getUser().getFullName() : "Customer");
            response.setCustomerPhone(delivery.getOrder().getUser() != null
                    ? delivery.getOrder().getUser().getPhone() : null);
            response.setDeliveryNotes(delivery.getDeliveryNotes());
            response.setContactless(delivery.getContactless());
            response.setAssignedAt(delivery.getAssignedAt());
            response.setEstimatedDeliveryTime(delivery.getEstimatedDeliveryTime());
            response.setOrderTotal(delivery.getOrder().getTotalAmount().doubleValue());

            response.setOrderItems(delivery.getOrder().getOrderItems().stream()
                    .map(item -> {
                        OrderItemInfo info = new OrderItemInfo();
                        info.setName(item.getMenu().getName());
                        info.setQuantity(item.getQuantity());
                        return info;
                    })
                    .collect(Collectors.toList()));

            return response;
        }
    }

    @Data
    public static class OrderItemInfo {
        private String name;
        private Integer quantity;
    }
}
