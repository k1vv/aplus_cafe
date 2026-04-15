package com.apluscafe.repository;

import com.apluscafe.entity.CompletedOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CompletedOrderRepository extends JpaRepository<CompletedOrder, Long> {

    List<CompletedOrder> findByUserId(Long userId);

    List<CompletedOrder> findByCompletedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT SUM(c.totalAmount) FROM CompletedOrder c WHERE c.completedAt BETWEEN ?1 AND ?2")
    BigDecimal sumTotalAmountBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(c) FROM CompletedOrder c WHERE c.completedAt BETWEEN ?1 AND ?2")
    Long countOrdersBetween(LocalDateTime start, LocalDateTime end);
}
