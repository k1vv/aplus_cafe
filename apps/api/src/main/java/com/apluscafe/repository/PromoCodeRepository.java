package com.apluscafe.repository;

import com.apluscafe.entity.PromoCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PromoCodeRepository extends JpaRepository<PromoCode, Long> {

    Optional<PromoCode> findByCodeIgnoreCase(String code);

    @Query("SELECT p FROM PromoCode p WHERE p.isActive = true " +
            "AND (p.validFrom IS NULL OR p.validFrom <= :now) " +
            "AND (p.validUntil IS NULL OR p.validUntil >= :now) " +
            "AND (p.usageLimit IS NULL OR p.usedCount < p.usageLimit)")
    List<PromoCode> findActivePromoCodes(LocalDateTime now);

    List<PromoCode> findAllByOrderByCreatedAtDesc();
}
