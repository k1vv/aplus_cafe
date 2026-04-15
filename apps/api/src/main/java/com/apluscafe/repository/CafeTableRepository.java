package com.apluscafe.repository;

import com.apluscafe.entity.CafeTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CafeTableRepository extends JpaRepository<CafeTable, Long> {

    Optional<CafeTable> findByTableNumber(String tableNumber);

    List<CafeTable> findByIsActiveTrue();

    List<CafeTable> findByFloorSection(String floorSection);

    List<CafeTable> findByCapacityGreaterThanEqual(Integer capacity);
}
