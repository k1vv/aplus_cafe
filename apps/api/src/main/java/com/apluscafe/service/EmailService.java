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

    // Brand colors
    private static final String BRAND_ORANGE = "#F97316";
    private static final String BRAND_DARK = "#1a1a1a";

    @Async
    public void sendVerificationEmail(String to, String fullName, String token) {
        String subject = "Verify your APlus Cafe account";
        String verificationLink = frontendUrl + "/verify-email?token=" + token;

        String htmlContent = """
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
                <!-- Header -->
                <div style="background-color: #1a1a1a; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #F97316; font-family: Georgia, 'Times New Roman', serif; margin: 0; font-size: 32px; font-weight: normal;">APlus</h1>
                    <p style="color: #888; font-size: 12px; margin: 5px 0 0 0; letter-spacing: 2px;">CAFE & RESTAURANT</p>
                </div>

                <!-- Body -->
                <div style="background-color: #ffffff; padding: 40px 30px;">
                    <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 24px;">Welcome, %s!</h2>
                    <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                        Thank you for joining APlus Cafe. To complete your registration and start ordering, please verify your email address.
                    </p>

                    <div style="text-align: center; margin: 35px 0;">
                        <a href="%s" style="background-color: #F97316; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                            Verify Email Address
                        </a>
                    </div>

                    <p style="color: #888; font-size: 13px; line-height: 1.6;">
                        Or copy and paste this link into your browser:<br>
                        <a href="%s" style="color: #F97316; word-break: break-all;">%s</a>
                    </p>

                    <div style="background-color: #fff7ed; border-left: 4px solid #F97316; padding: 15px; margin-top: 25px; border-radius: 0 8px 8px 0;">
                        <p style="color: #9a3412; font-size: 13px; margin: 0;">
                            This link will expire in 24 hours. If you didn't create an account, please ignore this email.
                        </p>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #1a1a1a; padding: 25px; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="color: #888; font-size: 12px; margin: 0;">
                        &copy; 2026 APlus Cafe. All rights reserved.
                    </p>
                    <p style="color: #666; font-size: 11px; margin: 10px 0 0 0;">
                        Questions? Contact us at support@aplus.cafe
                    </p>
                </div>
            </div>
            """.formatted(fullName, verificationLink, verificationLink, verificationLink);

        sendHtmlEmail(to, subject, htmlContent);
    }

    @Async
    public void sendPasswordResetEmail(String to, String fullName, String token) {
        String subject = "Reset your APlus Cafe password";
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        String htmlContent = """
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
                <!-- Header -->
                <div style="background-color: #1a1a1a; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #F97316; font-family: Georgia, 'Times New Roman', serif; margin: 0; font-size: 32px; font-weight: normal;">APlus</h1>
                    <p style="color: #888; font-size: 12px; margin: 5px 0 0 0; letter-spacing: 2px;">CAFE & RESTAURANT</p>
                </div>

                <!-- Body -->
                <div style="background-color: #ffffff; padding: 40px 30px;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <div style="background-color: #fff7ed; border-radius: 50%%; width: 60px; height: 60px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 28px;">🔐</span>
                        </div>
                    </div>

                    <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 24px; text-align: center;">Password Reset Request</h2>
                    <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                        Hi %s, we received a request to reset your password. Click the button below to create a new password:
                    </p>

                    <div style="text-align: center; margin: 35px 0;">
                        <a href="%s" style="background-color: #F97316; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                            Reset Password
                        </a>
                    </div>

                    <p style="color: #888; font-size: 13px; line-height: 1.6;">
                        Or copy and paste this link into your browser:<br>
                        <a href="%s" style="color: #F97316; word-break: break-all;">%s</a>
                    </p>

                    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-top: 25px; border-radius: 0 8px 8px 0;">
                        <p style="color: #991b1b; font-size: 13px; margin: 0;">
                            <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support immediately.
                        </p>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #1a1a1a; padding: 25px; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="color: #888; font-size: 12px; margin: 0;">
                        &copy; 2026 APlus Cafe. All rights reserved.
                    </p>
                    <p style="color: #666; font-size: 11px; margin: 10px 0 0 0;">
                        Questions? Contact us at support@aplus.cafe
                    </p>
                </div>
            </div>
            """.formatted(fullName, resetLink, resetLink, resetLink);

        sendHtmlEmail(to, subject, htmlContent);
    }

    @Async
    public void sendOrderReceiptEmail(String to, String fullName, Long orderId,
                                       java.util.List<OrderItemInfo> items,
                                       java.math.BigDecimal subtotal,
                                       java.math.BigDecimal serviceCharge,
                                       java.math.BigDecimal deliveryFee,
                                       java.math.BigDecimal total,
                                       String orderType,
                                       String deliveryAddress) {
        String subject = "Your APlus Cafe Order #" + orderId + " - Receipt";

        StringBuilder itemsHtml = new StringBuilder();
        for (OrderItemInfo item : items) {
            itemsHtml.append(String.format("""
                <tr>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #f0f0f0; color: #333;">%s</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #f0f0f0; text-align: center; color: #666;">%d</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #666;">RM %.2f</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #333; font-weight: 600;">RM %.2f</td>
                </tr>
                """, item.name(), item.quantity(), item.unitPrice(), item.subtotal()));
        }

        String deliveryInfo = "";
        if ("DELIVERY".equals(orderType) && deliveryAddress != null && !deliveryAddress.isEmpty()) {
            deliveryInfo = String.format("""
                <div style="background-color: #fff7ed; border-left: 4px solid #F97316; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <p style="color: #9a3412; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Delivery Address</p>
                    <p style="color: #333; margin: 0; font-size: 14px;">%s</p>
                </div>
                """, deliveryAddress);
        }

        String htmlContent = String.format("""
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
                <!-- Header -->
                <div style="background-color: #1a1a1a; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #F97316; font-family: Georgia, 'Times New Roman', serif; margin: 0; font-size: 32px; font-weight: normal;">APlus</h1>
                    <p style="color: #888; font-size: 12px; margin: 5px 0 0 0; letter-spacing: 2px;">CAFE & RESTAURANT</p>
                </div>

                <!-- Order Status Badge -->
                <div style="background-color: #ffffff; padding: 25px 30px 0 30px; text-align: center;">
                    <div style="background-color: #dcfce7; color: #166534; padding: 10px 20px; border-radius: 25px; display: inline-block; font-size: 12px; font-weight: bold; letter-spacing: 1px;">
                        ✓ ORDER CONFIRMED
                    </div>
                </div>

                <!-- Body -->
                <div style="background-color: #ffffff; padding: 30px;">
                    <h2 style="color: #1a1a1a; margin: 0 0 10px 0; font-size: 22px; text-align: center;">Thank you, %s!</h2>
                    <p style="color: #666; font-size: 15px; line-height: 1.6; text-align: center; margin: 0 0 25px 0;">
                        Your order <strong style="color: #F97316;">#%d</strong> has been confirmed.
                    </p>

                    <!-- Order Type -->
                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0; display: flex; align-items: center;">
                        <span style="font-size: 24px; margin-right: 12px;">%s</span>
                        <div>
                            <p style="color: #888; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Order Type</p>
                            <p style="color: #333; margin: 3px 0 0 0; font-size: 15px; font-weight: 600;">%s</p>
                        </div>
                    </div>

                    %s

                    <!-- Items Table -->
                    <table style="width: 100%%; border-collapse: collapse; margin: 25px 0;">
                        <thead>
                            <tr style="background-color: #1a1a1a;">
                                <th style="padding: 14px 10px; text-align: left; color: #F97316; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Item</th>
                                <th style="padding: 14px 10px; text-align: center; color: #F97316; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
                                <th style="padding: 14px 10px; text-align: right; color: #F97316; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Price</th>
                                <th style="padding: 14px 10px; text-align: right; color: #F97316; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Total</th>
                            </tr>
                        </thead>
                        <tbody style="background-color: #fafafa;">
                            %s
                        </tbody>
                    </table>

                    <!-- Totals -->
                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px;">
                        <table style="width: 100%%;">
                            <tr>
                                <td style="color: #666; padding: 8px 0; font-size: 14px;">Subtotal</td>
                                <td style="text-align: right; color: #333; padding: 8px 0; font-size: 14px;">RM %.2f</td>
                            </tr>
                            <tr>
                                <td style="color: #666; padding: 8px 0; font-size: 14px;">SST (6%%)</td>
                                <td style="text-align: right; color: #333; padding: 8px 0; font-size: 14px;">RM %.2f</td>
                            </tr>
                            <tr>
                                <td style="color: #666; padding: 8px 0; font-size: 14px;">Delivery Fee</td>
                                <td style="text-align: right; color: #333; padding: 8px 0; font-size: 14px;">RM %.2f</td>
                            </tr>
                            <tr>
                                <td colspan="2" style="padding: 10px 0;"><hr style="border: none; border-top: 1px solid #ddd; margin: 0;"></td>
                            </tr>
                            <tr>
                                <td style="color: #1a1a1a; padding: 8px 0; font-size: 18px; font-weight: bold;">Total</td>
                                <td style="text-align: right; color: #F97316; padding: 8px 0; font-size: 20px; font-weight: bold;">RM %.2f</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Track Order Button -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s/orders" style="background-color: #F97316; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                            Track Your Order
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #1a1a1a; padding: 25px; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="color: #888; font-size: 12px; margin: 0;">
                        &copy; 2026 APlus Cafe. All rights reserved.
                    </p>
                    <p style="color: #666; font-size: 11px; margin: 10px 0 0 0;">
                        Questions? Contact us at support@aplus.cafe
                    </p>
                </div>
            </div>
            """, fullName, orderId,
            "DELIVERY".equals(orderType) ? "🚚" : "PICKUP".equals(orderType) ? "🏪" : "🍽️",
            orderType.replace("_", " "), deliveryInfo, itemsHtml.toString(),
            subtotal, serviceCharge, deliveryFee, total, frontendUrl);

        sendHtmlEmail(to, subject, htmlContent);
    }

    public record OrderItemInfo(String name, int quantity, java.math.BigDecimal unitPrice, java.math.BigDecimal subtotal) {}

    @Async
    public void send2FAEnabledEmail(String to, String fullName) {
        String subject = "Two-Factor Authentication Enabled - APlus Cafe";

        String htmlContent = """
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
                <!-- Header -->
                <div style="background-color: #1a1a1a; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #F97316; font-family: Georgia, 'Times New Roman', serif; margin: 0; font-size: 32px; font-weight: normal;">APlus</h1>
                    <p style="color: #888; font-size: 12px; margin: 5px 0 0 0; letter-spacing: 2px;">CAFE & RESTAURANT</p>
                </div>

                <!-- Body -->
                <div style="background-color: #ffffff; padding: 40px 30px;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <div style="background-color: #dcfce7; border-radius: 50%%; width: 60px; height: 60px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 28px;">🔒</span>
                        </div>
                    </div>

                    <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 22px; text-align: center;">2FA Successfully Enabled</h2>
                    <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
                        Hi %s, two-factor authentication has been successfully enabled on your account.
                    </p>
                    <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                        From now on, you'll need to enter a verification code from your authenticator app when signing in.
                    </p>

                    <div style="background-color: #fff7ed; border-left: 4px solid #F97316; padding: 15px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                        <p style="color: #9a3412; font-size: 14px; margin: 0;">
                            <strong>Important:</strong> Make sure to save your backup codes in a secure place. You'll need them if you lose access to your authenticator app.
                        </p>
                    </div>

                    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-top: 20px; border-radius: 0 8px 8px 0;">
                        <p style="color: #991b1b; font-size: 13px; margin: 0;">
                            If you didn't enable 2FA, please contact support immediately at support@aplus.cafe
                        </p>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #1a1a1a; padding: 25px; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="color: #888; font-size: 12px; margin: 0;">
                        &copy; 2026 APlus Cafe. All rights reserved.
                    </p>
                </div>
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
