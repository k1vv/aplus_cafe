package com.apluscafe.repository;

import com.apluscafe.entity.ReservationSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservationSlotRepository extends JpaRepository<ReservationSlot, Long> {

    List<ReservationSlot> findByIsActiveTrue();

    @Query("SELECT rs FROM ReservationSlot rs WHERE rs.isActive = true AND (rs.dayOfWeek IS NULL OR rs.dayOfWeek = ?1) ORDER BY rs.startTime ASC")
    List<ReservationSlot> findActiveSlotsForDay(Integer dayOfWeek);
}
