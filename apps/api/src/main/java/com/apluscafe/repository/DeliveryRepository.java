package com.apluscafe.repository;

import com.apluscafe.entity.Delivery;
import com.apluscafe.enums.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    Optional<Delivery> findByOrderId(Long orderId);

    List<Delivery> findByRiderId(Long riderId);

    List<Delivery> findByRiderIdAndStatusNot(Long riderId, DeliveryStatus status);

    List<Delivery> findByStatus(DeliveryStatus status);

    List<Delivery> findByRiderIdAndStatus(Long riderId, DeliveryStatus status);

    List<Delivery> findByRiderIdOrderByCreatedAtDesc(Long riderId);

    List<Delivery> findByRiderIdAndStatusIn(Long riderId, List<DeliveryStatus> statuses);
}
