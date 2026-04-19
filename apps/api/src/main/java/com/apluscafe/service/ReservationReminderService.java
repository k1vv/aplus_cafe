package com.apluscafe.service;

import com.apluscafe.entity.Reservation;
import com.apluscafe.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationReminderService {

    private final ReservationRepository reservationRepository;
    private final EmailService emailService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a");

    /**
     * Scheduled job to send reservation reminders.
     * Runs every hour and sends reminders for reservations that are tomorrow.
     */
    @Scheduled(cron = "0 0 * * * *") // Every hour at minute 0
    @Transactional
    public void sendReservationReminders() {
        log.info("Starting reservation reminder job...");

        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Reservation> reservations = reservationRepository.findReservationsNeedingReminder(tomorrow);

        log.info("Found {} reservations needing reminders for {}", reservations.size(), tomorrow);

        for (Reservation reservation : reservations) {
            try {
                sendReminderEmail(reservation);
                reservation.setReminderSent(true);
                reservationRepository.save(reservation);
                log.info("Reminder sent for reservation ID: {}", reservation.getId());
            } catch (Exception e) {
                log.error("Failed to send reminder for reservation ID: {} - {}",
                        reservation.getId(), e.getMessage());
            }
        }

        log.info("Reservation reminder job completed. Sent {} reminders.", reservations.size());
    }

    private void sendReminderEmail(Reservation reservation) {
        String email = reservation.getUser().getEmail();
        String fullName = reservation.getUser().getFullName();
        String tableNumber = reservation.getTable().getTableNumber();
        String dateFormatted = reservation.getReservationDate().format(DATE_FORMATTER);
        String timeFormatted = reservation.getStartTime().format(TIME_FORMATTER);
        int partySize = reservation.getPartySize();

        emailService.sendReservationReminderEmail(
                email,
                fullName,
                reservation.getId(),
                tableNumber,
                dateFormatted,
                timeFormatted,
                partySize
        );
    }

    /**
     * Manually trigger reminders for testing
     */
    public int sendRemindersNow() {
        log.info("Manually triggering reservation reminders...");
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Reservation> reservations = reservationRepository.findReservationsNeedingReminder(tomorrow);

        int sent = 0;
        for (Reservation reservation : reservations) {
            try {
                sendReminderEmail(reservation);
                reservation.setReminderSent(true);
                reservationRepository.save(reservation);
                sent++;
            } catch (Exception e) {
                log.error("Failed to send reminder: {}", e.getMessage());
            }
        }
        return sent;
    }
}
