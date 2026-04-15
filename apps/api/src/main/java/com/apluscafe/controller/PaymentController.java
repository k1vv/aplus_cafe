package com.apluscafe.controller;

import com.apluscafe.dto.response.CheckoutResponse;
import com.apluscafe.security.UserDetailsImpl;
import com.apluscafe.service.PaymentService;
import com.stripe.exception.StripeException;
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

    @PostMapping("/checkout/{orderId}")
    public ResponseEntity<CheckoutResponse> createCheckoutSession(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long orderId) throws StripeException {
        return ResponseEntity.ok(paymentService.createCheckoutSession(orderId, userDetails.getId()));
    }

    @PostMapping("/checkout/confirm")
    public ResponseEntity<Void> confirmPayment(@RequestBody Map<String, String> request) {
        String sessionId = request.get("sessionId");
        paymentService.confirmPayment(sessionId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/webhook/stripe")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        paymentService.handleWebhookEvent(payload, sigHeader);
        return ResponseEntity.ok("Received");
    }
}
