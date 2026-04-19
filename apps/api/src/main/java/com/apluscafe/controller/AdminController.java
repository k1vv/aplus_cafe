package com.apluscafe.controller;

import com.apluscafe.dto.response.AnalyticsResponse;
import com.apluscafe.dto.response.MenuResponse;
import com.apluscafe.dto.response.OrderResponse;
import com.apluscafe.dto.response.ReservationResponse;
import com.apluscafe.dto.response.ReviewResponse;
import com.apluscafe.dto.response.ReviewStatsResponse;
import com.apluscafe.dto.response.UserResponse;
import com.apluscafe.entity.Announcement;
import com.apluscafe.entity.User;
import com.apluscafe.enums.OrderStatus;
import com.apluscafe.enums.ReservationStatus;
import com.apluscafe.repository.UserRepository;
import com.apluscafe.security.UserDetailsImpl;
import com.apluscafe.service.AnalyticsService;
import com.apluscafe.service.AnnouncementService;
import com.apluscafe.service.MenuService;
import com.apluscafe.service.OrderService;
import com.apluscafe.service.ReservationService;
import com.apluscafe.service.ReviewService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final MenuService menuService;
    private final OrderService orderService;
    private final ReservationService reservationService;
    private final AnnouncementService announcementService;
    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;
    private final ReviewService reviewService;

    // Analytics
    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsResponse> getAnalytics() {
        return ResponseEntity.ok(analyticsService.getAnalytics());
    }

    // Menu Management
    @GetMapping("/menu")
    public ResponseEntity<List<MenuResponse>> getAllMenuItems() {
        return ResponseEntity.ok(menuService.getAllMenuItems());
    }

    @PostMapping("/menu")
    public ResponseEntity<MenuResponse> createMenuItem(@RequestBody CreateMenuRequest request) {
        return ResponseEntity.ok(menuService.createMenuItem(
                request.getName(),
                request.getDescription(),
                request.getPrice(),
                request.getCategoryId(),
                request.getImageUrl()
        ));
    }

    @PutMapping("/menu/{id}")
    public ResponseEntity<MenuResponse> updateMenuItem(
            @PathVariable Long id,
            @RequestBody UpdateMenuRequest request) {
        return ResponseEntity.ok(menuService.updateMenuItem(
                id,
                request.getName(),
                request.getDescription(),
                request.getPrice(),
                request.getCategoryId(),
                request.getImageUrl(),
                request.getIsAvailable()
        ));
    }

    @DeleteMapping("/menu/{id}")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Long id) {
        menuService.deleteMenuItem(id);
        return ResponseEntity.ok().build();
    }

    // Order Management
    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> getAllActiveOrders() {
        return ResponseEntity.ok(orderService.getActiveOrders());
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, request.getStatus()));
    }

    // Reservation Management
    @GetMapping("/reservations")
    public ResponseEntity<List<ReservationResponse>> getReservationsForDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(reservationService.getReservationsForDate(date));
    }

    @PatchMapping("/reservations/{id}/status")
    public ResponseEntity<ReservationResponse> updateReservationStatus(
            @PathVariable Long id,
            @RequestBody UpdateReservationStatusRequest request) {
        return ResponseEntity.ok(reservationService.updateReservationStatus(id, request.getStatus()));
    }

    // User Management
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users.stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList()));
    }

    @PatchMapping("/users/{id}/active")
    public ResponseEntity<UserResponse> toggleUserActive(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(!user.getIsActive());
        user = userRepository.save(user);
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    // Announcement Management
    @GetMapping("/announcements")
    public ResponseEntity<List<Announcement>> getAllAnnouncements() {
        return ResponseEntity.ok(announcementService.getAllAnnouncements());
    }

    @PostMapping("/announcements")
    public ResponseEntity<Announcement> createAnnouncement(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody CreateAnnouncementRequest request) {
        return ResponseEntity.ok(announcementService.createAnnouncement(
                userDetails.getId(),
                request.getTitle(),
                request.getContent(),
                request.getImageUrl(),
                request.getStartDate(),
                request.getEndDate()
        ));
    }

    @PutMapping("/announcements/{id}")
    public ResponseEntity<Announcement> updateAnnouncement(
            @PathVariable Long id,
            @RequestBody UpdateAnnouncementRequest request) {
        return ResponseEntity.ok(announcementService.updateAnnouncement(
                id,
                request.getTitle(),
                request.getContent(),
                request.getImageUrl(),
                request.getStartDate(),
                request.getEndDate(),
                request.getIsActive()
        ));
    }

    @DeleteMapping("/announcements/{id}")
    public ResponseEntity<Void> deleteAnnouncement(@PathVariable Long id) {
        announcementService.deleteAnnouncement(id);
        return ResponseEntity.ok().build();
    }

    // Review Management
    @GetMapping("/reviews")
    public ResponseEntity<List<ReviewResponse>> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    @GetMapping("/reviews/stats")
    public ResponseEntity<ReviewStatsResponse> getReviewStats() {
        return ResponseEntity.ok(reviewService.getReviewStats());
    }

    @PostMapping("/reviews/{id}/respond")
    public ResponseEntity<ReviewResponse> respondToReview(
            @PathVariable Long id,
            @RequestBody ReviewResponseRequest request) {
        return ResponseEntity.ok(reviewService.respondToReview(id, request.getResponse()));
    }

    // Request DTOs
    @Data
    static class CreateMenuRequest {
        private String name;
        private String description;
        private BigDecimal price;
        private Long categoryId;
        private String imageUrl;
    }

    @Data
    static class UpdateMenuRequest {
        private String name;
        private String description;
        private BigDecimal price;
        private Long categoryId;
        private String imageUrl;
        private Boolean isAvailable;
    }

    @Data
    static class UpdateStatusRequest {
        private OrderStatus status;
    }

    @Data
    static class UpdateReservationStatusRequest {
        private ReservationStatus status;
    }

    @Data
    static class CreateAnnouncementRequest {
        private String title;
        private String content;
        private String imageUrl;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
    }

    @Data
    static class UpdateAnnouncementRequest {
        private String title;
        private String content;
        private String imageUrl;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private Boolean isActive;
    }

    @Data
    static class ReviewResponseRequest {
        private String response;
    }
}
