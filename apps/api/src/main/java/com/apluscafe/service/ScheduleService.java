package com.apluscafe.service;

import com.apluscafe.entity.ClosedDate;
import com.apluscafe.entity.RecurringClosure;
import com.apluscafe.repository.ClosedDateRepository;
import com.apluscafe.repository.RecurringClosureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ClosedDateRepository closedDateRepository;
    private final RecurringClosureRepository recurringClosureRepository;

    /**
     * Check if the cafe is open on a specific date
     */
    public boolean isOpenOnDate(LocalDate date) {
        // Check specific closed dates first
        if (closedDateRepository.existsByDate(date)) {
            return false;
        }

        // Check recurring closures (convert Java DayOfWeek to our format: 0=Sunday, 1=Monday, etc.)
        int dayOfWeek = convertDayOfWeek(date.getDayOfWeek());
        return !recurringClosureRepository.existsByDayOfWeekAndIsActiveTrue(dayOfWeek);
    }

    /**
     * Get the reason why a date is closed (if closed)
     */
    public String getClosedReason(LocalDate date) {
        // Check specific closed dates first
        var closedDate = closedDateRepository.findByDate(date);
        if (closedDate.isPresent()) {
            return closedDate.get().getReason();
        }

        // Check recurring closures
        int dayOfWeek = convertDayOfWeek(date.getDayOfWeek());
        var recurringClosure = recurringClosureRepository.findByDayOfWeekAndIsActiveTrue(dayOfWeek);
        if (recurringClosure.isPresent()) {
            return recurringClosure.get().getReason();
        }

        return null;
    }

    /**
     * Get all closed dates for a given month (combines specific dates + recurring closures)
     */
    public List<LocalDate> getClosedDatesForMonth(YearMonth yearMonth) {
        Set<LocalDate> closedDates = new HashSet<>();

        // Get specific closed dates in the month
        LocalDate startOfMonth = yearMonth.atDay(1);
        LocalDate endOfMonth = yearMonth.atEndOfMonth();

        List<ClosedDate> specificClosedDates = closedDateRepository.findByDateBetween(startOfMonth, endOfMonth);
        for (ClosedDate cd : specificClosedDates) {
            closedDates.add(cd.getDate());
        }

        // Get recurring closures and generate dates for the month
        List<RecurringClosure> recurringClosures = recurringClosureRepository.findByIsActiveTrue();
        for (RecurringClosure rc : recurringClosures) {
            DayOfWeek dayOfWeek = convertToDayOfWeek(rc.getDayOfWeek());
            LocalDate firstOccurrence = startOfMonth.with(TemporalAdjusters.nextOrSame(dayOfWeek));

            LocalDate current = firstOccurrence;
            while (!current.isAfter(endOfMonth)) {
                closedDates.add(current);
                current = current.plusWeeks(1);
            }
        }

        return new ArrayList<>(closedDates);
    }

    // ==================== CRUD Operations ====================

    // --- Closed Dates ---

    public List<ClosedDate> getAllClosedDates() {
        return closedDateRepository.findAll();
    }

    public List<ClosedDate> getClosedDatesForMonth(String monthStr) {
        YearMonth yearMonth = YearMonth.parse(monthStr);
        LocalDate startOfMonth = yearMonth.atDay(1);
        LocalDate endOfMonth = yearMonth.atEndOfMonth();
        return closedDateRepository.findByDateBetween(startOfMonth, endOfMonth);
    }

    public List<ClosedDate> getUpcomingClosedDates() {
        return closedDateRepository.findByDateGreaterThanEqualOrderByDateAsc(LocalDate.now());
    }

    @Transactional
    public ClosedDate addClosedDate(LocalDate date, String reason) {
        if (closedDateRepository.existsByDate(date)) {
            throw new IllegalArgumentException("This date is already marked as closed");
        }

        ClosedDate closedDate = ClosedDate.builder()
                .date(date)
                .reason(reason)
                .build();

        return closedDateRepository.save(closedDate);
    }

    @Transactional
    public void deleteClosedDate(Long id) {
        if (!closedDateRepository.existsById(id)) {
            throw new IllegalArgumentException("Closed date not found");
        }
        closedDateRepository.deleteById(id);
    }

    // --- Recurring Closures ---

    public List<RecurringClosure> getAllRecurringClosures() {
        return recurringClosureRepository.findAllByOrderByDayOfWeekAsc();
    }

    @Transactional
    public RecurringClosure addRecurringClosure(Integer dayOfWeek, String reason) {
        if (dayOfWeek < 0 || dayOfWeek > 6) {
            throw new IllegalArgumentException("Day of week must be between 0 (Sunday) and 6 (Saturday)");
        }

        // Check if already exists and active
        if (recurringClosureRepository.existsByDayOfWeekAndIsActiveTrue(dayOfWeek)) {
            throw new IllegalArgumentException("This day is already set as a recurring closure");
        }

        RecurringClosure closure = RecurringClosure.builder()
                .dayOfWeek(dayOfWeek)
                .reason(reason)
                .isActive(true)
                .build();

        return recurringClosureRepository.save(closure);
    }

    @Transactional
    public void deleteRecurringClosure(Long id) {
        if (!recurringClosureRepository.existsById(id)) {
            throw new IllegalArgumentException("Recurring closure not found");
        }
        recurringClosureRepository.deleteById(id);
    }

    @Transactional
    public RecurringClosure toggleRecurringClosure(Long id) {
        RecurringClosure closure = recurringClosureRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recurring closure not found"));
        closure.setIsActive(!closure.getIsActive());
        return recurringClosureRepository.save(closure);
    }

    // ==================== Helper Methods ====================

    /**
     * Convert Java DayOfWeek (MONDAY=1 to SUNDAY=7) to our format (SUNDAY=0 to SATURDAY=6)
     */
    private int convertDayOfWeek(DayOfWeek dayOfWeek) {
        return dayOfWeek.getValue() % 7; // SUNDAY becomes 0, MONDAY becomes 1, etc.
    }

    /**
     * Convert our format (0=Sunday to 6=Saturday) to Java DayOfWeek
     */
    private DayOfWeek convertToDayOfWeek(int day) {
        if (day == 0) return DayOfWeek.SUNDAY;
        return DayOfWeek.of(day);
    }
}
