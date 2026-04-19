package com.apluscafe.controller;

import com.apluscafe.dto.request.DirectCheckoutRequest;
import com.apluscafe.dto.response.CheckoutResponse;
import com.apluscafe.security.UserDetailsImpl;
import com.apluscafe.service.PaymentService;
import com.stripe.exception.StripeException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/checkout/create-session")
    public ResponseEntity<CheckoutResponse> createDirectCheckoutSession(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody DirectCheckoutRequest request) throws StripeException {
        Long userId = userDetails != null ? userDetails.getId() : null;
        return ResponseEntity.ok(paymentService.createDirectCheckoutSession(request, userId));
    }

    @PostMapping("/checkout/{orderId}")
    public ResponseEntity<CheckoutResponse> createCheckoutSession(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long orderId) throws StripeException {
        return ResponseEntity.ok(paymentService.createCheckoutSession(orderId, userDetails.getId()));
    }

    @PostMapping("/checkout/confirm")
    public ResponseEntity<Void> confirmPayment(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody Map<String, String> request) {
        String sessionId = request.get("sessionId");
        Long userId = userDetails != null ? userDetails.getId() : null;
        paymentService.confirmPayment(sessionId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/webhook/stripe")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String sigHeader) {
        try {
            paymentService.handleWebhookEvent(payload, sigHeader);
            return ResponseEntity.ok("Received");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Webhook error: " + e.getMessage());
        }
    }
}
