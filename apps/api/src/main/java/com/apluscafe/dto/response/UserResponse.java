package com.apluscafe.dto.response;

import com.apluscafe.entity.User;
import com.apluscafe.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private UserRole role;
    private Boolean emailVerified;
    private Boolean twoFactorEnabled;
    private DeliveryAddress deliveryAddress;
    private String createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeliveryAddress {
        private String address;
        private Double lat;
        private Double lng;
    }

    public static UserResponse fromEntity(User user) {
        DeliveryAddress deliveryAddr = null;
        if (user.getDeliveryAddress() != null && user.getDeliveryLat() != null && user.getDeliveryLng() != null) {
            deliveryAddr = DeliveryAddress.builder()
                    .address(user.getDeliveryAddress())
                    .lat(user.getDeliveryLat())
                    .lng(user.getDeliveryLng())
                    .build();
        }

        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .emailVerified(user.getEmailVerified())
                .twoFactorEnabled(user.getTwoFactorEnabled())
                .deliveryAddress(deliveryAddr)
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }
}
