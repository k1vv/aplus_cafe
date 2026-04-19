package com.apluscafe.controller;

import com.apluscafe.dto.request.CreateReservationRequest;
import com.apluscafe.dto.response.CafeTableResponse;
import com.apluscafe.dto.response.ReservationResponse;
import com.apluscafe.entity.ReservationSlot;
import com.apluscafe.security.UserDetailsImpl;
import com.apluscafe.service.ReservationService;
import com.apluscafe.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;
    private final ScheduleService scheduleService;

    @GetMapping("/tables")
    public ResponseEntity<List<CafeTableResponse>> getAllTables() {
        return ResponseEntity.ok(reservationService.getAllTables());
    }

    // ==================== Cafe Schedule (Public) ====================

    /**
     * Check if cafe is open on a specific date
     */
    @GetMapping("/cafe/check-date")
    public ResponseEntity<DateCheckResponse> checkDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        boolean isOpen = scheduleService.isOpenOnDate(date);
        String reason = isOpen ? null : scheduleService.getClosedReason(date);
        return ResponseEntity.ok(new DateCheckResponse(date, isOpen, reason));
    }

    /**
     * Get all closed dates for a given month (for calendar display)
     */
    @GetMapping("/cafe/closed-dates")
    public ResponseEntity<List<LocalDate>> getClosedDatesForMonth(
            @RequestParam String month) { // Format: "2024-12"
        YearMonth yearMonth = YearMonth.parse(month);
        return ResponseEntity.ok(scheduleService.getClosedDatesForMonth(yearMonth));
    }

    @GetMapping("/tables/available")
    public ResponseEntity<List<CafeTableResponse>> getAvailableTables(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime,
            @RequestParam Integer partySize) {
        return ResponseEntity.ok(reservationService.getAvailableTables(date, startTime, endTime, partySize));
    }

    @GetMapping("/reservation-slots")
    public ResponseEntity<List<ReservationSlot>> getReservationSlots(
            @RequestParam(required = false) Integer dayOfWeek) {
        return ResponseEntity.ok(reservationService.getAvailableSlots(dayOfWeek));
    }

    @PostMapping("/reservations")
    public ResponseEntity<ReservationResponse> createReservation(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CreateReservationRequest request) {
        return ResponseEntity.ok(reservationService.createReservation(userDetails.getId(), request));
    }

    @GetMapping("/reservations")
    public ResponseEntity<List<ReservationResponse>> getUserReservations(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(reservationService.getUserReservations(userDetails.getId()));
    }

    @GetMapping("/reservations/{id}")
    public ResponseEntity<ReservationResponse> getReservation(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(reservationService.getReservation(id, userDetails.getId()));
    }

    @DeleteMapping("/reservations/{id}")
    public ResponseEntity<ReservationResponse> cancelReservation(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(reservationService.cancelReservation(id, userDetails.getId()));
    }

    // ==================== Response DTOs ====================

    @Data
    @lombok.AllArgsConstructor
    static class DateCheckResponse {
        private LocalDate date;
        private boolean isOpen;
        private String closedReason;
    }
}
