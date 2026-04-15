package com.apluscafe.service;

import com.apluscafe.entity.Announcement;
import com.apluscafe.entity.User;
import com.apluscafe.repository.AnnouncementRepository;
import com.apluscafe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;

    public List<Announcement> getCurrentAnnouncements() {
        log.debug("Fetching current active announcements");
        List<Announcement> announcements = announcementRepository.findCurrentAnnouncements(LocalDateTime.now());
        log.debug("Found {} current announcements", announcements.size());
        return announcements;
    }

    public List<Announcement> getAllAnnouncements() {
        log.debug("Fetching all announcements");
        List<Announcement> announcements = announcementRepository.findAll();
        log.debug("Found {} total announcements", announcements.size());
        return announcements;
    }

    @Transactional
    public Announcement createAnnouncement(Long adminId, String title, String content,
                                            String imageUrl, LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Creating announcement: '{}' by admin ID: {}", title, adminId);

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> {
                    log.error("Admin user not found: {}", adminId);
                    return new RuntimeException("User not found");
                });

        Announcement announcement = Announcement.builder()
                .title(title)
                .content(content)
                .imageUrl(imageUrl)
                .startDate(startDate)
                .endDate(endDate)
                .isActive(true)
                .createdBy(admin)
                .build();

        announcement = announcementRepository.save(announcement);
        log.info("Announcement created - ID: {}, title: '{}', active: {}-{}",
                announcement.getId(), title, startDate, endDate);
        return announcement;
    }

    @Transactional
    public Announcement updateAnnouncement(Long id, String title, String content,
                                            String imageUrl, LocalDateTime startDate,
                                            LocalDateTime endDate, Boolean isActive) {
        log.info("Updating announcement ID: {}", id);

        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Announcement not found for update: {}", id);
                    return new RuntimeException("Announcement not found");
                });

        if (title != null) announcement.setTitle(title);
        if (content != null) announcement.setContent(content);
        if (imageUrl != null) announcement.setImageUrl(imageUrl);
        if (startDate != null) announcement.setStartDate(startDate);
        if (endDate != null) announcement.setEndDate(endDate);
        if (isActive != null) announcement.setIsActive(isActive);

        announcement = announcementRepository.save(announcement);
        log.info("Announcement updated - ID: {}, title: '{}'", id, announcement.getTitle());
        return announcement;
    }

    @Transactional
    public void deleteAnnouncement(Long id) {
        log.info("Deleting announcement ID: {}", id);
        announcementRepository.deleteById(id);
        log.info("Announcement deleted - ID: {}", id);
    }
}
