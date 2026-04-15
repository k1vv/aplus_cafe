package com.apluscafe.service;

import com.apluscafe.dto.request.*;
import com.apluscafe.dto.response.AuthResponse;
import com.apluscafe.dto.response.TwoFactorSetupResponse;
import com.apluscafe.dto.response.UserResponse;
import com.apluscafe.entity.PasswordResetToken;
import com.apluscafe.entity.RefreshToken;
import com.apluscafe.entity.User;
import com.apluscafe.enums.UserRole;
import com.apluscafe.repository.PasswordResetTokenRepository;
import com.apluscafe.repository.RefreshTokenRepository;
import com.apluscafe.repository.UserRepository;
import com.apluscafe.security.JwtService;
import com.apluscafe.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final TotpService totpService;

    // Temporary storage for 2FA verification (in production, use Redis or similar)
    private final Map<String, Long> twoFactorTokens = new ConcurrentHashMap<>();

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Attempting to register new user with email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed - email already exists: {}", request.getEmail());
            throw new RuntimeException("Email already exists");
        }

        // Generate email verification token
        String verificationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(UserRole.USER)
                .isActive(true)
                .emailVerified(false)
                .emailVerificationToken(verificationToken)
                .emailVerificationTokenExpiry(LocalDateTime.now().plusHours(24))
                .twoFactorEnabled(false)
                .build();

        user = userRepository.save(user);
        log.info("User registered successfully with ID: {} and email: {}", user.getId(), user.getEmail());

        // Send verification email
        try {
            emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), verificationToken);
            log.info("Verification email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send verification email to: {}. Error: {}", user.getEmail(), e.getMessage());
            // Don't fail registration if email fails - user can request resend
        }

        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = createRefreshToken(user);
        log.debug("Generated tokens for user: {}", user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(UserResponse.fromEntity(user))
                .requiresTwoFactor(false)
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getEmail())
                .orElseThrow(() -> {
                    log.error("User not found after authentication: {}", userDetails.getEmail());
                    return new RuntimeException("User not found");
                });

        // Check if email is verified
        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            log.warn("Login attempt for unverified email: {}", user.getEmail());
            throw new RuntimeException("Please verify your email address before signing in. Check your inbox for the verification link.");
        }

        // Check if 2FA is enabled
        if (Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
            // Generate temporary token for 2FA verification
            String twoFactorToken = UUID.randomUUID().toString();
            twoFactorTokens.put(twoFactorToken, user.getId());
            log.info("2FA required for user: {}", user.getEmail());

            return AuthResponse.builder()
                    .requiresTwoFactor(true)
                    .twoFactorToken(twoFactorToken)
                    .build();
        }

        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = createRefreshToken(user);
        log.info("User logged in successfully: {} (ID: {})", user.getEmail(), user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(UserResponse.fromEntity(user))
                .requiresTwoFactor(false)
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(String refreshTokenStr) {
        log.debug("Attempting to refresh token");

        RefreshToken refreshToken = refreshTokenRepository.findByTokenAndIsRevokedFalse(refreshTokenStr)
                .orElseThrow(() -> {
                    log.warn("Invalid refresh token attempted");
                    return new RuntimeException("Invalid refresh token");
                });

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("Expired refresh token attempted for user ID: {}", refreshToken.getUser().getId());
            throw new RuntimeException("Refresh token expired");
        }

        User user = refreshToken.getUser();
        UserDetailsImpl userDetails = UserDetailsImpl.build(user);

        // Revoke old token and create new one
        refreshToken.setIsRevoked(true);
        refreshTokenRepository.save(refreshToken);
        log.debug("Old refresh token revoked for user: {}", user.getEmail());

        String accessToken = jwtService.generateToken(userDetails);
        String newRefreshToken = createRefreshToken(user);
        log.info("Token refreshed successfully for user: {}", user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newRefreshToken)
                .user(UserResponse.fromEntity(user))
                .build();
    }

    @Transactional
    public void logout(Long userId) {
        log.info("User logging out, revoking all tokens for user ID: {}", userId);
        refreshTokenRepository.revokeAllUserTokens(userId);
        log.debug("All refresh tokens revoked for user ID: {}", userId);
    }

    private String createRefreshToken(User user) {
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiresAt(LocalDateTime.now().plusSeconds(jwtService.getRefreshExpiration() / 1000))
                .isRevoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);
        return refreshToken.getToken();
    }

    // ==================== EMAIL VERIFICATION ====================

    @Transactional
    public void verifyEmail(String token) {
        log.info("Verifying email with token");

        User user = userRepository.findByEmailVerificationToken(token)
                .orElseThrow(() -> {
                    log.warn("Invalid email verification token");
                    return new RuntimeException("Invalid verification token");
                });

        if (user.getEmailVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            log.warn("Email verification token expired for user: {}", user.getEmail());
            throw new RuntimeException("Verification token has expired");
        }

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            log.info("Email already verified for user: {}", user.getEmail());
            return;
        }

        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationTokenExpiry(null);
        userRepository.save(user);
        log.info("Email verified successfully for user: {}", user.getEmail());
    }

    @Transactional
    public void resendVerificationEmail(String email) {
        log.info("Resending verification email to: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("User not found for email verification resend: {}", email);
                    return new RuntimeException("User not found");
                });

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            log.info("Email already verified for user: {}", email);
            throw new RuntimeException("Email is already verified");
        }

        String verificationToken = UUID.randomUUID().toString();
        user.setEmailVerificationToken(verificationToken);
        user.setEmailVerificationTokenExpiry(LocalDateTime.now().plusHours(24));
        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), verificationToken);
        log.info("Verification email resent to: {}", email);
    }

    // ==================== TWO-FACTOR AUTHENTICATION ====================

    public TwoFactorSetupResponse setupTwoFactor(Long userId) {
        log.info("Setting up 2FA for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
            throw new RuntimeException("Two-factor authentication is already enabled");
        }

        String secret = totpService.generateSecret();
        String qrCodeDataUri = totpService.generateQrCodeDataUri(secret, user.getEmail());
        String manualEntryKey = totpService.getManualEntryKey(secret);

        return TwoFactorSetupResponse.builder()
                .secret(secret)
                .qrCodeDataUri(qrCodeDataUri)
                .manualEntryKey(manualEntryKey)
                .build();
    }

    @Transactional
    public void enableTwoFactor(Long userId, EnableTwoFactorRequest request) {
        log.info("Enabling 2FA for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
            throw new RuntimeException("Two-factor authentication is already enabled");
        }

        // Verify the code before enabling
        if (!totpService.verifyCode(request.getSecret(), request.getCode())) {
            log.warn("Invalid 2FA code during setup for user: {}", user.getEmail());
            throw new RuntimeException("Invalid verification code");
        }

        user.setTwoFactorEnabled(true);
        user.setTwoFactorSecret(request.getSecret());
        userRepository.save(user);

        // Send confirmation email
        emailService.send2FAEnabledEmail(user.getEmail(), user.getFullName());
        log.info("2FA enabled successfully for user: {}", user.getEmail());
    }

    @Transactional
    public void disableTwoFactor(Long userId, String code) {
        log.info("Disabling 2FA for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
            throw new RuntimeException("Two-factor authentication is not enabled");
        }

        // Verify the code before disabling
        if (!totpService.verifyCode(user.getTwoFactorSecret(), code)) {
            log.warn("Invalid 2FA code during disable for user: {}", user.getEmail());
            throw new RuntimeException("Invalid verification code");
        }

        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        userRepository.save(user);
        log.info("2FA disabled successfully for user: {}", user.getEmail());
    }

    @Transactional
    public AuthResponse verifyTwoFactor(VerifyTwoFactorRequest request) {
        log.info("Verifying 2FA code");

        Long userId = twoFactorTokens.get(request.getTwoFactorToken());
        if (userId == null) {
            log.warn("Invalid or expired 2FA token");
            throw new RuntimeException("Invalid or expired two-factor token");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!totpService.verifyCode(user.getTwoFactorSecret(), request.getCode())) {
            log.warn("Invalid 2FA code for user: {}", user.getEmail());
            throw new RuntimeException("Invalid verification code");
        }

        // Remove the temporary token
        twoFactorTokens.remove(request.getTwoFactorToken());

        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = createRefreshToken(user);
        log.info("2FA verified successfully for user: {}", user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(UserResponse.fromEntity(user))
                .requiresTwoFactor(false)
                .build();
    }

    // ==================== PASSWORD RESET ====================

    @Transactional
    public void forgotPassword(String email) {
        log.info("Processing forgot password request for: {}", email);

        User user = userRepository.findByEmail(email).orElse(null);

        // Always return success to prevent email enumeration attacks
        if (user == null) {
            log.warn("Forgot password requested for non-existent email: {}", email);
            return;
        }

        // Invalidate any existing tokens
        passwordResetTokenRepository.invalidateAllUserTokens(user.getId());

        // Create new reset token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .token(token)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .isUsed(false)
                .build();

        passwordResetTokenRepository.save(resetToken);

        // Send reset email
        emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), token);
        log.info("Password reset email sent to: {}", email);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        log.info("Processing password reset");

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenAndIsUsedFalse(request.getToken())
                .orElseThrow(() -> {
                    log.warn("Invalid password reset token");
                    return new RuntimeException("Invalid or expired reset token");
                });

        if (resetToken.isExpired()) {
            log.warn("Password reset token expired");
            throw new RuntimeException("Reset token has expired");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        // Mark token as used
        resetToken.setIsUsed(true);
        passwordResetTokenRepository.save(resetToken);

        // Revoke all refresh tokens for security
        refreshTokenRepository.revokeAllUserTokens(user.getId());
        log.info("Password reset successfully for user: {}", user.getEmail());
    }
}
