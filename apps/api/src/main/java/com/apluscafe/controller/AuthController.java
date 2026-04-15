package com.apluscafe.controller;

import com.apluscafe.dto.request.*;
import com.apluscafe.dto.response.AuthResponse;
import com.apluscafe.dto.response.TwoFactorSetupResponse;
import com.apluscafe.dto.response.UserResponse;
import com.apluscafe.entity.User;
import com.apluscafe.repository.UserRepository;
import com.apluscafe.security.UserDetailsImpl;
import com.apluscafe.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        return ResponseEntity.ok(authService.refreshToken(refreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        authService.logout(userDetails.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    // ==================== EMAIL VERIFICATION ====================

    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestBody Map<String, String> request) {
        authService.verifyEmail(request.get("token"));
        return ResponseEntity.ok(Map.of("message", "Email verified successfully"));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(@RequestBody Map<String, String> request) {
        authService.resendVerificationEmail(request.get("email"));
        return ResponseEntity.ok(Map.of("message", "Verification email sent"));
    }

    // ==================== TWO-FACTOR AUTHENTICATION ====================

    @GetMapping("/2fa/setup")
    public ResponseEntity<TwoFactorSetupResponse> setupTwoFactor(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(authService.setupTwoFactor(userDetails.getId()));
    }

    @PostMapping("/2fa/enable")
    public ResponseEntity<Map<String, String>> enableTwoFactor(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody EnableTwoFactorRequest request) {
        authService.enableTwoFactor(userDetails.getId(), request);
        return ResponseEntity.ok(Map.of("message", "Two-factor authentication enabled"));
    }

    @PostMapping("/2fa/disable")
    public ResponseEntity<Map<String, String>> disableTwoFactor(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody Map<String, String> request) {
        authService.disableTwoFactor(userDetails.getId(), request.get("code"));
        return ResponseEntity.ok(Map.of("message", "Two-factor authentication disabled"));
    }

    @PostMapping("/2fa/verify")
    public ResponseEntity<AuthResponse> verifyTwoFactor(@Valid @RequestBody VerifyTwoFactorRequest request) {
        return ResponseEntity.ok(authService.verifyTwoFactor(request));
    }

    // ==================== PASSWORD RESET ====================

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "If an account exists with this email, a reset link has been sent"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }
}
