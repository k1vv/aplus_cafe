package com.apluscafe.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${spring.mail.from:noreply@aplus.cafe}")
    private String fromEmail;

    @Async
    public void sendVerificationEmail(String to, String fullName, String token) {
        String subject = "Verify your APlus Cafe account";
        String verificationLink = frontendUrl + "/verify-email?token=" + token;

        String htmlContent = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #c9a45c; font-family: 'DM Serif Display', serif;">APlus Cafe</h1>
                </div>
                <h2 style="color: #333;">Welcome, %s!</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Thank you for registering with APlus Cafe. Please verify your email address by clicking the button below:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="%s" style="background-color: #c9a45c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                    Or copy and paste this link into your browser:<br>
                    <a href="%s" style="color: #c9a45c;">%s</a>
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    This link will expire in 24 hours. If you didn't create an account, please ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    &copy; APlus Cafe. All rights reserved.
                </p>
            </div>
            """.formatted(fullName, verificationLink, verificationLink, verificationLink);

        sendHtmlEmail(to, subject, htmlContent);
    }

    @Async
    public void sendPasswordResetEmail(String to, String fullName, String token) {
        String subject = "Reset your APlus Cafe password";
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        String htmlContent = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #c9a45c; font-family: 'DM Serif Display', serif;">APlus Cafe</h1>
                </div>
                <h2 style="color: #333;">Password Reset Request</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Hi %s, we received a request to reset your password. Click the button below to create a new password:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="%s" style="background-color: #c9a45c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                    Or copy and paste this link into your browser:<br>
                    <a href="%s" style="color: #c9a45c;">%s</a>
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    &copy; APlus Cafe. All rights reserved.
                </p>
            </div>
            """.formatted(fullName, resetLink, resetLink, resetLink);

        sendHtmlEmail(to, subject, htmlContent);
    }

    @Async
    public void send2FAEnabledEmail(String to, String fullName) {
        String subject = "Two-Factor Authentication Enabled";

        String htmlContent = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #c9a45c; font-family: 'DM Serif Display', serif;">APlus Cafe</h1>
                </div>
                <h2 style="color: #333;">Two-Factor Authentication Enabled</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Hi %s, two-factor authentication has been successfully enabled on your account.
                </p>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    From now on, you'll need to enter a verification code from your authenticator app when signing in.
                </p>
                <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="color: #856404; font-size: 14px; margin: 0;">
                        <strong>Important:</strong> Make sure to save your backup codes in a secure place. You'll need them if you lose access to your authenticator app.
                    </p>
                </div>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    If you didn't enable 2FA, please contact support immediately.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    &copy; APlus Cafe. All rights reserved.
                </p>
            </div>
            """.formatted(fullName);

        sendHtmlEmail(to, subject, htmlContent);
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to: {}. Error: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send email", e);
        }
    }

    public void sendSimpleEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);

        mailSender.send(message);
        log.info("Simple email sent successfully to: {}", to);
    }
}
