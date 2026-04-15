package com.apluscafe.repository;

import com.apluscafe.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findByIsActiveTrue();

    @Query("SELECT a FROM Announcement a WHERE a.isActive = true " +
           "AND (a.startDate IS NULL OR a.startDate <= ?1) " +
           "AND (a.endDate IS NULL OR a.endDate >= ?1) " +
           "ORDER BY a.createdAt DESC")
    List<Announcement> findCurrentAnnouncements(LocalDateTime now);
}
