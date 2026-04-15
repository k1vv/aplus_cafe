package com.apluscafe.repository;

import com.apluscafe.entity.RiderDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RiderDetailsRepository extends JpaRepository<RiderDetails, Long> {

    Optional<RiderDetails> findByUserId(Long userId);

    List<RiderDetails> findByIsAvailableTrue();

    @Query("SELECT r FROM RiderDetails r WHERE r.isAvailable = true ORDER BY " +
           "(SELECT COUNT(d) FROM Delivery d WHERE d.rider = r AND d.status NOT IN ('DELIVERED')) ASC, " +
           "r.rating DESC")
    List<RiderDetails> findAvailableRidersOrderByWorkloadAndRating();
}
