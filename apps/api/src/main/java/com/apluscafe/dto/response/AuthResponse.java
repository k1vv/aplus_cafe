package com.apluscafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private UserResponse user;

    // For 2FA flow - when true, client needs to call /verify-2fa endpoint
    private Boolean requiresTwoFactor;
    private String twoFactorToken; // Temporary token for 2FA verification
}
