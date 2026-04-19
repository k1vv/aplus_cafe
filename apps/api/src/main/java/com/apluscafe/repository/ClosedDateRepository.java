package com.apluscafe.repository;

import com.apluscafe.entity.ClosedDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClosedDateRepository extends JpaRepository<ClosedDate, Long> {

    Optional<ClosedDate> findByDate(LocalDate date);

    boolean existsByDate(LocalDate date);

    List<ClosedDate> findByDateBetween(LocalDate startDate, LocalDate endDate);

    List<ClosedDate> findByDateGreaterThanEqualOrderByDateAsc(LocalDate date);
}
