package com.apluscafe.repository;

import com.apluscafe.entity.RecurringClosure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecurringClosureRepository extends JpaRepository<RecurringClosure, Long> {

    List<RecurringClosure> findByIsActiveTrue();

    Optional<RecurringClosure> findByDayOfWeekAndIsActiveTrue(Integer dayOfWeek);

    boolean existsByDayOfWeekAndIsActiveTrue(Integer dayOfWeek);

    List<RecurringClosure> findAllByOrderByDayOfWeekAsc();
}
