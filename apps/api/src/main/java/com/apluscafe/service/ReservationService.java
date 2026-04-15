package com.apluscafe.service;

import com.apluscafe.dto.request.CreateReservationRequest;
import com.apluscafe.dto.response.CafeTableResponse;
import com.apluscafe.dto.response.ReservationResponse;
import com.apluscafe.entity.CafeTable;
import com.apluscafe.entity.Reservation;
import com.apluscafe.entity.ReservationSlot;
import com.apluscafe.entity.User;
import com.apluscafe.enums.ReservationStatus;
import com.apluscafe.repository.CafeTableRepository;
import com.apluscafe.repository.ReservationRepository;
import com.apluscafe.repository.ReservationSlotRepository;
import com.apluscafe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final CafeTableRepository cafeTableRepository;
    private final ReservationSlotRepository reservationSlotRepository;
    private final UserRepository userRepository;

    public List<CafeTableResponse> getAllTables() {
        log.debug("Fetching all active tables");
        List<CafeTableResponse> tables = cafeTableRepository.findByIsActiveTrue().stream()
                .map(CafeTableResponse::fromEntity)
                .collect(Collectors.toList());
        log.debug("Found {} active tables", tables.size());
        return tables;
    }

    public List<ReservationSlot> getAvailableSlots(Integer dayOfWeek) {
        log.debug("Fetching available slots for day of week: {}", dayOfWeek);
        List<ReservationSlot> slots = reservationSlotRepository.findActiveSlotsForDay(dayOfWeek);
        log.debug("Found {} available slots for day: {}", slots.size(), dayOfWeek);
        return slots;
    }

    public List<CafeTableResponse> getAvailableTables(LocalDate date, LocalTime startTime,
                                                       LocalTime endTime, Integer partySize) {
        log.debug("Searching available tables - date: {}, time: {}-{}, party size: {}",
                date, startTime, endTime, partySize);

        List<CafeTable> allTables = cafeTableRepository.findByCapacityGreaterThanEqual(partySize);
        log.debug("Found {} tables with capacity >= {}", allTables.size(), partySize);

        List<CafeTableResponse> availableTables = allTables.stream()
                .filter(table -> {
                    List<Reservation> conflicts = reservationRepository
                            .findConflictingReservations(table.getId(), date, startTime, endTime);
                    return conflicts.isEmpty();
                })
                .map(CafeTableResponse::fromEntity)
                .collect(Collectors.toList());

        log.debug("Found {} available tables after conflict check", availableTables.size());
        return availableTables;
    }

    @Transactional
    public ReservationResponse createReservation(Long userId, CreateReservationRequest request) {
        log.info("Creating reservation - user ID: {}, table ID: {}, date: {}, party size: {}",
                userId, request.getTableId(), request.getReservationDate(), request.getPartySize());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found for reservation: {}", userId);
                    return new RuntimeException("User not found");
                });

        CafeTable table = cafeTableRepository.findById(request.getTableId())
                .orElseThrow(() -> {
                    log.error("Table not found for reservation: {}", request.getTableId());
                    return new RuntimeException("Table not found");
                });

        // Check capacity
        if (request.getPartySize() > table.getCapacity()) {
            log.warn("Party size {} exceeds table {} capacity of {}",
                    request.getPartySize(), table.getId(), table.getCapacity());
            throw new RuntimeException("Party size exceeds table capacity");
        }

        // Check for conflicts
        List<Reservation> conflicts = reservationRepository.findConflictingReservations(
                table.getId(),
                request.getReservationDate(),
                request.getStartTime(),
                request.getEndTime()
        );

        if (!conflicts.isEmpty()) {
            log.warn("Table {} has {} conflicting reservations for the requested time slot",
                    table.getId(), conflicts.size());
            throw new RuntimeException("Table is not available for the selected time slot");
        }

        Reservation reservation = Reservation.builder()
                .user(user)
                .table(table)
                .reservationDate(request.getReservationDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .partySize(request.getPartySize())
                .status(ReservationStatus.PENDING)
                .specialRequests(request.getSpecialRequests())
                .contactPhone(request.getContactPhone())
                .build();

        reservation = reservationRepository.save(reservation);
        log.info("Reservation created successfully - ID: {}, table: {}, date: {}, time: {}-{}",
                reservation.getId(), table.getTableNumber(), request.getReservationDate(),
                request.getStartTime(), request.getEndTime());
        return ReservationResponse.fromEntity(reservation);
    }

    public List<ReservationResponse> getUserReservations(Long userId) {
        log.debug("Fetching reservations for user ID: {}", userId);
        List<ReservationResponse> reservations = reservationRepository.findByUserId(userId).stream()
                .map(ReservationResponse::fromEntity)
                .collect(Collectors.toList());
        log.debug("Found {} reservations for user ID: {}", reservations.size(), userId);
        return reservations;
    }

    public ReservationResponse getReservation(Long reservationId, Long userId) {
        log.debug("Fetching reservation ID: {} for user ID: {}", reservationId, userId);

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> {
                    log.warn("Reservation not found: {}", reservationId);
                    return new RuntimeException("Reservation not found");
                });

        if (!reservation.getUser().getId().equals(userId)) {
            log.warn("User {} attempted to access reservation {} belonging to user {}",
                    userId, reservationId, reservation.getUser().getId());
            throw new RuntimeException("Reservation not found");
        }

        return ReservationResponse.fromEntity(reservation);
    }

    @Transactional
    public ReservationResponse cancelReservation(Long reservationId, Long userId) {
        log.info("Cancelling reservation ID: {} by user ID: {}", reservationId, userId);

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> {
                    log.error("Reservation not found for cancellation: {}", reservationId);
                    return new RuntimeException("Reservation not found");
                });

        if (!reservation.getUser().getId().equals(userId)) {
            log.warn("User {} attempted to cancel reservation {} belonging to user {}",
                    userId, reservationId, reservation.getUser().getId());
            throw new RuntimeException("Reservation not found");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation = reservationRepository.save(reservation);
        log.info("Reservation cancelled successfully - ID: {}", reservationId);
        return ReservationResponse.fromEntity(reservation);
    }

    // Admin methods
    @Transactional
    public ReservationResponse updateReservationStatus(Long reservationId, ReservationStatus status) {
        log.info("Updating reservation {} status to: {}", reservationId, status);

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> {
                    log.error("Reservation not found for status update: {}", reservationId);
                    return new RuntimeException("Reservation not found");
                });

        ReservationStatus previousStatus = reservation.getStatus();
        reservation.setStatus(status);
        reservation = reservationRepository.save(reservation);
        log.info("Reservation {} status updated: {} -> {}", reservationId, previousStatus, status);
        return ReservationResponse.fromEntity(reservation);
    }

    public List<ReservationResponse> getReservationsForDate(LocalDate date) {
        log.debug("Fetching reservations for date: {}", date);
        List<ReservationResponse> reservations = reservationRepository.findByReservationDate(date).stream()
                .map(ReservationResponse::fromEntity)
                .collect(Collectors.toList());
        log.debug("Found {} reservations for date: {}", reservations.size(), date);
        return reservations;
    }
}
