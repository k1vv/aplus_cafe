package com.apluscafe.controller;

import com.apluscafe.dto.response.AnalyticsResponse;
import com.apluscafe.dto.response.MenuResponse;
import com.apluscafe.dto.response.OrderResponse;
import com.apluscafe.dto.response.ReservationResponse;
import com.apluscafe.dto.response.ReviewResponse;
import com.apluscafe.dto.response.ReviewStatsResponse;
import com.apluscafe.dto.response.UserResponse;
import com.apluscafe.entity.Announcement;
import com.apluscafe.entity.ClosedDate;
import com.apluscafe.entity.RecurringClosure;
import com.apluscafe.entity.RiderDetails;
import com.apluscafe.entity.User;
import com.apluscafe.enums.OrderStatus;
import com.apluscafe.enums.ReservationStatus;
import com.apluscafe.enums.UserRole;
import com.apluscafe.repository.RiderDetailsRepository;
import com.apluscafe.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.apluscafe.security.UserDetailsImpl;
import com.apluscafe.service.AnalyticsService;
import com.apluscafe.service.AnnouncementService;
import com.apluscafe.service.DeliveryService;
import com.apluscafe.service.MenuService;
import com.apluscafe.service.OrderService;
import com.apluscafe.service.ReservationService;
import com.apluscafe.service.ReviewService;
import com.apluscafe.service.ScheduleService;
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
    private final RiderDetailsRepository riderDetailsRepository;
    private final DeliveryService deliveryService;
    private final PasswordEncoder passwordEncoder;
    private final ScheduleService scheduleService;

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
        return ResponseEntity.ok(orderService.updateOrderStatus(id, request.getStatus(), request.getCancellationReason()));
    }

    // Rider Management
    @GetMapping("/riders")
    public ResponseEntity<List<RiderResponse>> getAvailableRiders() {
        List<RiderDetails> riders = riderDetailsRepository.findAll();
        return ResponseEntity.ok(riders.stream()
                .map(r -> new RiderResponse(
                        r.getId(),
                        r.getUser().getFullName(),
                        r.getVehicleType(),
                        r.getLicensePlate(),
                        r.getIsAvailable(),
                        r.getRating()
                ))
                .collect(Collectors.toList()));
    }

    @PostMapping("/orders/{orderId}/assign-rider")
    public ResponseEntity<Void> assignRider(
            @PathVariable Long orderId,
            @RequestBody AssignRiderRequest request) {
        deliveryService.assignRider(orderId, request.getRiderId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/orders/{orderId}/assign-rider")
    public ResponseEntity<Void> unassignRider(@PathVariable Long orderId) {
        deliveryService.unassignRider(orderId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/riders")
    public ResponseEntity<UserResponse> createRider(@RequestBody CreateRiderRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Create user with RIDER role
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(UserRole.RIDER)
                .isActive(true)
                .emailVerified(true) // Riders created by admin are auto-verified
                .twoFactorEnabled(false)
                .build();
        user = userRepository.save(user);

        // Create rider details
        RiderDetails riderDetails = RiderDetails.builder()
                .user(user)
                .vehicleType(request.getVehicleType())
                .licensePlate(request.getLicensePlate())
                .isAvailable(true)
                .rating(5.0)
                .totalDeliveries(0)
                .build();
        riderDetailsRepository.save(riderDetails);

        return ResponseEntity.ok(UserResponse.fromEntity(user));
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

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Don't allow deleting admin users
        if (user.getRole() == UserRole.ADMIN) {
            throw new RuntimeException("Cannot delete admin users");
        }

        // Delete rider details if exists
        riderDetailsRepository.findByUserId(id).ifPresent(riderDetailsRepository::delete);

        userRepository.delete(user);
        return ResponseEntity.ok().build();
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

    // ==================== Schedule Management ====================

    // Closed Dates
    @GetMapping("/closed-dates")
    public ResponseEntity<List<ClosedDate>> getClosedDates(
            @RequestParam(required = false) String month) {
        if (month != null) {
            return ResponseEntity.ok(scheduleService.getClosedDatesForMonth(month));
        }
        return ResponseEntity.ok(scheduleService.getUpcomingClosedDates());
    }

    @PostMapping("/closed-dates")
    public ResponseEntity<ClosedDate> addClosedDate(@RequestBody AddClosedDateRequest request) {
        return ResponseEntity.ok(scheduleService.addClosedDate(request.getDate(), request.getReason()));
    }

    @DeleteMapping("/closed-dates/{id}")
    public ResponseEntity<Void> deleteClosedDate(@PathVariable Long id) {
        scheduleService.deleteClosedDate(id);
        return ResponseEntity.ok().build();
    }

    // Recurring Closures
    @GetMapping("/recurring-closures")
    public ResponseEntity<List<RecurringClosure>> getRecurringClosures() {
        return ResponseEntity.ok(scheduleService.getAllRecurringClosures());
    }

    @PostMapping("/recurring-closures")
    public ResponseEntity<RecurringClosure> addRecurringClosure(@RequestBody AddRecurringClosureRequest request) {
        return ResponseEntity.ok(scheduleService.addRecurringClosure(request.getDayOfWeek(), request.getReason()));
    }

    @DeleteMapping("/recurring-closures/{id}")
    public ResponseEntity<Void> deleteRecurringClosure(@PathVariable Long id) {
        scheduleService.deleteRecurringClosure(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/recurring-closures/{id}/toggle")
    public ResponseEntity<RecurringClosure> toggleRecurringClosure(@PathVariable Long id) {
        return ResponseEntity.ok(scheduleService.toggleRecurringClosure(id));
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
        private String cancellationReason;
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

    @Data
    static class AssignRiderRequest {
        private Long riderId;
    }

    @Data
    static class CreateRiderRequest {
        private String email;
        private String password;
        private String fullName;
        private String phone;
        private String vehicleType;
        private String licensePlate;
    }

    @Data
    @lombok.AllArgsConstructor
    static class RiderResponse {
        private Long id;
        private String name;
        private String vehicleType;
        private String licensePlate;
        private Boolean isAvailable;
        private Double rating;
    }

    @Data
    static class AddClosedDateRequest {
        private LocalDate date;
        private String reason;
    }

    @Data
    static class AddRecurringClosureRequest {
        private Integer dayOfWeek;
        private String reason;
    }
}
