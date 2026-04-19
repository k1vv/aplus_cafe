package com.apluscafe.service;

import com.apluscafe.controller.RiderTrackingController;
import com.apluscafe.entity.Delivery;
import com.apluscafe.entity.RiderDetails;
import com.apluscafe.enums.DeliveryStatus;
import com.apluscafe.repository.DeliveryRepository;
import com.apluscafe.repository.RiderDetailsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class RiderSimulationService {

    private final RiderDetailsRepository riderDetailsRepository;
    private final DeliveryRepository deliveryRepository;

    // Shop location - UNITEN MZ D Tasek Hall
    private static final double SHOP_LAT = 2.9772;
    private static final double SHOP_LNG = 101.731;

    // Track active simulations to prevent duplicates
    private final Map<Long, Boolean> activeSimulations = new ConcurrentHashMap<>();

    /**
     * Check if rider is the SimBot (simulation rider)
     */
    public boolean isSimBot(RiderDetails rider) {
        return rider.getUser().getEmail().equals("simbot.rider@apluscafe.com");
    }

    /**
     * Start simulation for SimBot rider when assigned to delivery
     */
    @Async
    public void startSimulation(Long deliveryId) {
        if (activeSimulations.putIfAbsent(deliveryId, true) != null) {
            log.debug("Simulation already running for delivery: {}", deliveryId);
            return;
        }

        try {
            Delivery delivery = deliveryRepository.findById(deliveryId).orElse(null);
            if (delivery == null || delivery.getRider() == null) {
                log.warn("Cannot start simulation - delivery or rider not found: {}", deliveryId);
                return;
            }

            RiderDetails rider = delivery.getRider();
            if (!isSimBot(rider)) {
                log.debug("Not a SimBot rider, skipping simulation");
                return;
            }

            log.info("Starting SimBot simulation for delivery: {}", deliveryId);

            // Get destination coordinates from delivery
            Double destLat = delivery.getDeliveryLatitude();
            Double destLng = delivery.getDeliveryLongitude();

            // If no coordinates, try to parse from address
            if (destLat == null || destLng == null) {
                String address = delivery.getDeliveryAddress();
                if (address != null && address.contains("[") && address.contains("]")) {
                    try {
                        String coords = address.substring(address.lastIndexOf("[") + 1, address.lastIndexOf("]"));
                        String[] parts = coords.split(",");
                        destLat = Double.parseDouble(parts[0].trim());
                        destLng = Double.parseDouble(parts[1].trim());
                    } catch (Exception e) {
                        log.warn("Could not parse coordinates from address: {}", address);
                        // Default to a nearby location for demo
                        destLat = SHOP_LAT + 0.01;
                        destLng = SHOP_LNG + 0.01;
                    }
                } else {
                    // Default to a nearby location for demo
                    destLat = SHOP_LAT + 0.01;
                    destLng = SHOP_LNG + 0.01;
                }
            }

            // Start from shop location
            double currentLat = SHOP_LAT;
            double currentLng = SHOP_LNG;

            // Update rider's initial position
            rider.setCurrentLatitude(currentLat);
            rider.setCurrentLongitude(currentLng);
            riderDetailsRepository.save(rider);

            // Update delivery status to PICKED_UP
            delivery.setStatus(DeliveryStatus.PICKED_UP);
            delivery.setPickedUpAt(java.time.LocalDateTime.now());
            deliveryRepository.save(delivery);

            // Simulate movement in steps
            int steps = 20; // 20 steps to reach destination
            double latStep = (destLat - currentLat) / steps;
            double lngStep = (destLng - currentLng) / steps;

            for (int i = 0; i < steps; i++) {
                // Check if delivery was cancelled
                delivery = deliveryRepository.findById(deliveryId).orElse(null);
                if (delivery == null || delivery.getStatus() == DeliveryStatus.CANCELLED) {
                    log.info("Simulation cancelled for delivery: {}", deliveryId);
                    break;
                }

                // Update delivery status to IN_TRANSIT after a few steps
                if (i == 2 && delivery.getStatus() != DeliveryStatus.IN_TRANSIT) {
                    delivery.setStatus(DeliveryStatus.IN_TRANSIT);
                    deliveryRepository.save(delivery);
                }

                // Move rider
                currentLat += latStep;
                currentLng += lngStep;

                // Add some randomness for realism
                currentLat += (Math.random() - 0.5) * 0.0002;
                currentLng += (Math.random() - 0.5) * 0.0002;

                rider.setCurrentLatitude(currentLat);
                rider.setCurrentLongitude(currentLng);
                riderDetailsRepository.save(rider);

                // Broadcast location update to connected clients via SSE
                RiderTrackingController.broadcastRiderLocation(
                    deliveryId,
                    currentLat,
                    currentLng,
                    rider.getUser().getFullName(),
                    rider.getVehicleType(),
                    delivery.getStatus().name()
                );

                log.debug("SimBot moved to [{}, {}] - step {}/{}", currentLat, currentLng, i + 1, steps);

                // Wait between steps (3 seconds per step = ~60 seconds total)
                Thread.sleep(3000);
            }

            // Mark as delivered
            delivery = deliveryRepository.findById(deliveryId).orElse(null);
            if (delivery != null && delivery.getStatus() != DeliveryStatus.CANCELLED) {
                delivery.setStatus(DeliveryStatus.DELIVERED);
                delivery.setActualDeliveryTime(java.time.LocalDateTime.now());
                deliveryRepository.save(delivery);

                // Update rider's final position
                rider.setCurrentLatitude(destLat);
                rider.setCurrentLongitude(destLng);
                rider.setTotalDeliveries(rider.getTotalDeliveries() + 1);
                riderDetailsRepository.save(rider);

                log.info("SimBot simulation completed - delivery {} marked as DELIVERED", deliveryId);
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("SimBot simulation interrupted for delivery: {}", deliveryId);
        } catch (Exception e) {
            log.error("SimBot simulation error for delivery: {}", deliveryId, e);
        } finally {
            activeSimulations.remove(deliveryId);

            // Reset SimBot to shop location
            resetSimBotToShop();
        }
    }

    /**
     * Reset SimBot back to shop location after delivery
     */
    private void resetSimBotToShop() {
        try {
            riderDetailsRepository.findAll().stream()
                .filter(this::isSimBot)
                .findFirst()
                .ifPresent(rider -> {
                    rider.setCurrentLatitude(SHOP_LAT);
                    rider.setCurrentLongitude(SHOP_LNG);
                    riderDetailsRepository.save(rider);
                    log.debug("SimBot reset to shop location");
                });
        } catch (Exception e) {
            log.error("Failed to reset SimBot location", e);
        }
    }

    /**
     * Stop simulation for a delivery (e.g., when cancelled)
     */
    public void stopSimulation(Long deliveryId) {
        activeSimulations.remove(deliveryId);
    }
}
