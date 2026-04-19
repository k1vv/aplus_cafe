package com.apluscafe.controller;

import com.apluscafe.dto.request.CreateReviewRequest;
import com.apluscafe.dto.request.SaveDeliveryAddressRequest;
import com.apluscafe.dto.response.MenuResponse;
import com.apluscafe.dto.response.ReviewResponse;
import com.apluscafe.dto.response.UserResponse;
import com.apluscafe.entity.Address;
import com.apluscafe.entity.User;
import com.apluscafe.repository.AddressRepository;
import com.apluscafe.repository.UserRepository;
import com.apluscafe.security.UserDetailsImpl;
import com.apluscafe.service.FavoriteService;
import com.apluscafe.service.ReviewService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final FavoriteService favoriteService;
    private final ReviewService reviewService;

    // ==================== PROFILE ENDPOINTS ====================

    @GetMapping("/profile")
    public ResponseEntity<ProfileResponse> getProfile(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        log.debug("Fetching profile for user ID: {}", userDetails.getId());

        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(ProfileResponse.fromEntity(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<ProfileResponse> updateProfile(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {

        log.info("Updating profile for user ID: {}", userDetails.getId());

        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        user = userRepository.save(user);
        log.info("Profile updated for user: {}", user.getEmail());

        return ResponseEntity.ok(ProfileResponse.fromEntity(user));
    }

    // ==================== ADDRESS ENDPOINTS ====================

    @GetMapping("/addresses")
    public ResponseEntity<List<AddressResponse>> getAddresses(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        log.debug("Fetching addresses for user ID: {}", userDetails.getId());

        List<Address> addresses = addressRepository.findByUserId(userDetails.getId());
        List<AddressResponse> response = addresses.stream()
                .map(AddressResponse::fromEntity)
                .collect(Collectors.toList());

        log.debug("Found {} addresses for user ID: {}", addresses.size(), userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/addresses")
    public ResponseEntity<AddressResponse> addAddress(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CreateAddressRequest request) {

        log.info("Adding new address for user ID: {}", userDetails.getId());

        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // If this is marked as default, unset other defaults
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            addressRepository.findByUserId(userDetails.getId()).forEach(addr -> {
                if (addr.getIsDefault()) {
                    addr.setIsDefault(false);
                    addressRepository.save(addr);
                }
            });
        }

        Address address = Address.builder()
                .user(user)
                .label(request.getLabel())
                .addressLine(request.getStreet())
                .city(request.getCity())
                .postalCode(request.getPostalCode())
                .latitude(request.getLat())
                .longitude(request.getLng())
                .isDefault(Boolean.TRUE.equals(request.getIsDefault()))
                .build();

        address = addressRepository.save(address);
        log.info("Address created with ID: {} for user: {}", address.getId(), user.getEmail());

        return ResponseEntity.ok(AddressResponse.fromEntity(address));
    }

    @PutMapping("/addresses/{id}")
    public ResponseEntity<AddressResponse> updateAddress(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CreateAddressRequest request) {

        log.info("Updating address ID: {} for user ID: {}", id, userDetails.getId());

        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        // Verify ownership
        if (!address.getUser().getId().equals(userDetails.getId())) {
            log.warn("User {} attempted to update address {} belonging to another user",
                    userDetails.getId(), id);
            throw new RuntimeException("Address not found");
        }

        // If this is marked as default, unset other defaults
        if (Boolean.TRUE.equals(request.getIsDefault()) && !address.getIsDefault()) {
            addressRepository.findByUserId(userDetails.getId()).forEach(addr -> {
                if (addr.getIsDefault() && !addr.getId().equals(id)) {
                    addr.setIsDefault(false);
                    addressRepository.save(addr);
                }
            });
        }

        address.setLabel(request.getLabel());
        address.setAddressLine(request.getStreet());
        address.setCity(request.getCity());
        address.setPostalCode(request.getPostalCode());
        address.setLatitude(request.getLat());
        address.setLongitude(request.getLng());
        address.setIsDefault(Boolean.TRUE.equals(request.getIsDefault()));

        address = addressRepository.save(address);
        log.info("Address ID: {} updated successfully", id);

        return ResponseEntity.ok(AddressResponse.fromEntity(address));
    }

    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<Void> deleteAddress(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        log.info("Deleting address ID: {} for user ID: {}", id, userDetails.getId());

        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        // Verify ownership
        if (!address.getUser().getId().equals(userDetails.getId())) {
            log.warn("User {} attempted to delete address {} belonging to another user",
                    userDetails.getId(), id);
            throw new RuntimeException("Address not found");
        }

        addressRepository.delete(address);
        log.info("Address ID: {} deleted successfully", id);

        return ResponseEntity.ok().build();
    }

    // ==================== DELIVERY ADDRESS ENDPOINTS ====================

    @GetMapping("/delivery-address")
    public ResponseEntity<?> getDeliveryAddress(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getDeliveryAddress() == null) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(UserResponse.DeliveryAddress.builder()
                .address(user.getDeliveryAddress())
                .lat(user.getDeliveryLat())
                .lng(user.getDeliveryLng())
                .build());
    }

    @PutMapping("/delivery-address")
    public ResponseEntity<?> saveDeliveryAddress(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody SaveDeliveryAddressRequest request) {

        log.info("Saving delivery address for user ID: {}", userDetails.getId());

        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setDeliveryAddress(request.getAddress());
        user.setDeliveryLat(request.getLat());
        user.setDeliveryLng(request.getLng());

        userRepository.save(user);
        log.info("Delivery address saved for user: {}", user.getEmail());

        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    // ==================== FAVORITES ENDPOINTS ====================

    @GetMapping("/favorites")
    public ResponseEntity<List<MenuResponse>> getFavorites(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(favoriteService.getUserFavorites(userDetails.getId()));
    }

    @GetMapping("/favorites/ids")
    public ResponseEntity<Set<Long>> getFavoriteIds(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(favoriteService.getUserFavoriteIds(userDetails.getId()));
    }

    @PostMapping("/favorites/{menuId}")
    public ResponseEntity<Map<String, Boolean>> toggleFavorite(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long menuId) {
        boolean isFavorite = favoriteService.toggleFavorite(userDetails.getId(), menuId);
        return ResponseEntity.ok(Map.of("isFavorite", isFavorite));
    }

    // ==================== REVIEWS ENDPOINTS ====================

    @GetMapping("/reviews")
    public ResponseEntity<List<ReviewResponse>> getMyReviews(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(reviewService.getUserReviews(userDetails.getId()));
    }

    @GetMapping("/orders/{orderId}/review")
    public ResponseEntity<ReviewResponse> getOrderReview(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long orderId) {
        ReviewResponse review = reviewService.getReviewByOrder(orderId);
        if (review == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(review);
    }

    @GetMapping("/orders/{orderId}/can-review")
    public ResponseEntity<Map<String, Boolean>> canReviewOrder(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long orderId) {
        boolean canReview = reviewService.canReviewOrder(userDetails.getId(), orderId);
        return ResponseEntity.ok(Map.of("canReview", canReview));
    }

    @PostMapping("/reviews")
    public ResponseEntity<ReviewResponse> createReview(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CreateReviewRequest request) {
        return ResponseEntity.ok(reviewService.createReview(userDetails.getId(), request));
    }

    // ==================== DTOs ====================

    @Data
    public static class UpdateProfileRequest {
        private String fullName;
        private String phone;
    }

    @Data
    public static class CreateAddressRequest {
        @NotBlank(message = "Label is required")
        private String label;

        @NotBlank(message = "Address is required")
        private String street;

        private String city;

        private String postalCode;

        private Double lat;

        private Double lng;

        private Boolean isDefault;
    }

    @Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ProfileResponse {
        private Long id;
        private String email;
        private String fullName;
        private String phone;
        private String createdAt;

        public static ProfileResponse fromEntity(User user) {
            return ProfileResponse.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .phone(user.getPhone())
                    .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                    .build();
        }
    }

    @Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class AddressResponse {
        private Long id;
        private String label;
        private String street;
        private String city;
        private String postalCode;
        private Double lat;
        private Double lng;
        private Boolean isDefault;

        public static AddressResponse fromEntity(Address address) {
            return AddressResponse.builder()
                    .id(address.getId())
                    .label(address.getLabel())
                    .street(address.getAddressLine())
                    .city(address.getCity())
                    .postalCode(address.getPostalCode())
                    .lat(address.getLatitude())
                    .lng(address.getLongitude())
                    .isDefault(address.getIsDefault())
                    .build();
        }
    }
}
