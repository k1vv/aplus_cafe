package com.apluscafe.repository;

import com.apluscafe.entity.Reservation;
import com.apluscafe.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByUserId(Long userId);

    List<Reservation> findByTableId(Long tableId);

    List<Reservation> findByReservationDate(LocalDate date);

    List<Reservation> findByReservationDateAndStatus(LocalDate date, ReservationStatus status);

    @Query("SELECT r FROM Reservation r WHERE r.table.id = ?1 AND r.reservationDate = ?2 AND r.status NOT IN ('CANCELLED', 'COMPLETED')")
    List<Reservation> findActiveReservationsForTableOnDate(Long tableId, LocalDate date);

    @Query("SELECT r FROM Reservation r WHERE r.table.id = ?1 AND r.reservationDate = ?2 " +
           "AND r.status NOT IN ('CANCELLED', 'COMPLETED') " +
           "AND ((r.startTime <= ?3 AND r.endTime > ?3) OR (r.startTime < ?4 AND r.endTime >= ?4) OR (r.startTime >= ?3 AND r.endTime <= ?4))")
    List<Reservation> findConflictingReservations(Long tableId, LocalDate date, LocalTime startTime, LocalTime endTime);
}
