package com.apluscafe.controller;

import com.apluscafe.dto.request.ApplyPromoRequest;
import com.apluscafe.dto.request.CreatePromoCodeRequest;
import com.apluscafe.dto.response.PromoCodeResponse;
import com.apluscafe.dto.response.PromoValidationResponse;
import com.apluscafe.service.PromoCodeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PromoCodeController {

    private final PromoCodeService promoCodeService;

    @PostMapping("/promo/validate")
    public ResponseEntity<PromoValidationResponse> validatePromoCode(
            @Valid @RequestBody ApplyPromoRequest request) {
        return ResponseEntity.ok(promoCodeService.validateAndCalculateDiscount(request));
    }

    // Admin endpoints
    @GetMapping("/admin/promo-codes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PromoCodeResponse>> getAllPromoCodes() {
        return ResponseEntity.ok(promoCodeService.getAllPromoCodes());
    }

    @PostMapping("/admin/promo-codes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PromoCodeResponse> createPromoCode(
            @Valid @RequestBody CreatePromoCodeRequest request) {
        return ResponseEntity.ok(promoCodeService.createPromoCode(request));
    }

    @PutMapping("/admin/promo-codes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PromoCodeResponse> updatePromoCode(
            @PathVariable Long id,
            @Valid @RequestBody CreatePromoCodeRequest request) {
        return ResponseEntity.ok(promoCodeService.updatePromoCode(id, request));
    }

    @PatchMapping("/admin/promo-codes/{id}/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> togglePromoCodeActive(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Boolean> body) {
        promoCodeService.togglePromoCodeActive(id, body.get("active"));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/admin/promo-codes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePromoCode(@PathVariable Long id) {
        promoCodeService.deletePromoCode(id);
        return ResponseEntity.ok().build();
    }
}
