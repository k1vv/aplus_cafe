package com.apluscafe.service;

import com.apluscafe.entity.Delivery;
import com.apluscafe.entity.RiderDetails;
import com.apluscafe.enums.DeliveryStatus;
import com.apluscafe.repository.DeliveryRepository;
import com.apluscafe.repository.RiderDetailsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final RiderDetailsRepository riderDetailsRepository;
    private final RiderSimulationService riderSimulationService;

    public List<RiderDetails> getAvailableRiders() {
        return riderDetailsRepository.findByIsAvailableTrue();
    }

    @Transactional
    public Delivery assignRider(Long orderId, Long riderId) {
        log.info("Assigning rider {} to order {}", riderId, orderId);

        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Delivery not found for order: " + orderId));

        RiderDetails rider = riderDetailsRepository.findById(riderId)
                .orElseThrow(() -> new RuntimeException("Rider not found: " + riderId));

        delivery.setRider(rider);
        delivery.setStatus(DeliveryStatus.ASSIGNED);
        delivery.setAssignedAt(LocalDateTime.now());
        delivery.setEstimatedDeliveryTime(LocalDateTime.now().plusMinutes(30));

        delivery = deliveryRepository.save(delivery);
        log.info("Rider {} assigned to order {}", rider.getUser().getFullName(), orderId);

        // If SimBot is assigned, start the simulation
        if (riderSimulationService.isSimBot(rider)) {
            log.info("SimBot assigned - starting delivery simulation for order {}", orderId);
            riderSimulationService.startSimulation(delivery.getId());
        }

        return delivery;
    }

    @Transactional
    public Delivery unassignRider(Long orderId) {
        log.info("Unassigning rider from order {}", orderId);

        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Delivery not found for order: " + orderId));

        delivery.setRider(null);
        delivery.setStatus(DeliveryStatus.PENDING_ASSIGNMENT);
        delivery.setAssignedAt(null);
        delivery.setEstimatedDeliveryTime(null);

        return deliveryRepository.save(delivery);
    }

    public Delivery getDeliveryByOrderId(Long orderId) {
        return deliveryRepository.findByOrderId(orderId).orElse(null);
    }
}
