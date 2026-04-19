package com.apluscafe.service;

import com.apluscafe.dto.request.ApplyPromoRequest;
import com.apluscafe.dto.request.CreatePromoCodeRequest;
import com.apluscafe.dto.response.PromoCodeResponse;
import com.apluscafe.dto.response.PromoValidationResponse;
import com.apluscafe.entity.PromoCode;
import com.apluscafe.enums.DiscountType;
import com.apluscafe.repository.PromoCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PromoCodeService {

    private final PromoCodeRepository promoCodeRepository;

    public PromoValidationResponse validateAndCalculateDiscount(ApplyPromoRequest request) {
        log.info("Validating promo code: {}", request.getCode());

        PromoCode promo = promoCodeRepository.findByCodeIgnoreCase(request.getCode().trim())
                .orElse(null);

        if (promo == null) {
            log.warn("Promo code not found: {}", request.getCode());
            return PromoValidationResponse.invalid("Invalid promo code");
        }

        // Check if active
        if (!promo.getIsActive()) {
            return PromoValidationResponse.invalid("This promo code is no longer active");
        }

        LocalDateTime now = LocalDateTime.now();

        // Check validity period
        if (promo.getValidFrom() != null && now.isBefore(promo.getValidFrom())) {
            return PromoValidationResponse.invalid("This promo code is not yet valid");
        }

        if (promo.getValidUntil() != null && now.isAfter(promo.getValidUntil())) {
            return PromoValidationResponse.invalid("This promo code has expired");
        }

        // Check usage limit
        if (promo.getUsageLimit() != null && promo.getUsedCount() != null
                && promo.getUsedCount() >= promo.getUsageLimit()) {
            return PromoValidationResponse.invalid("This promo code has reached its usage limit");
        }

        // Check minimum order amount
        if (promo.getMinimumOrderAmount() != null
                && request.getSubtotal().compareTo(promo.getMinimumOrderAmount()) < 0) {
            return PromoValidationResponse.invalid(
                    String.format("Minimum order amount is RM %.2f", promo.getMinimumOrderAmount()));
        }

        // Calculate discount
        BigDecimal discount = calculateDiscount(promo, request.getSubtotal());

        log.info("Promo code {} validated successfully, discount: {}", request.getCode(), discount);

        return PromoValidationResponse.builder()
                .valid(true)
                .code(promo.getCode())
                .description(promo.getDescription())
                .discountType(promo.getDiscountType().name())
                .discountValue(promo.getDiscountValue())
                .discountAmount(discount)
                .build();
    }

    private BigDecimal calculateDiscount(PromoCode promo, BigDecimal subtotal) {
        BigDecimal discount;

        if (promo.getDiscountType() == DiscountType.PERCENTAGE) {
            discount = subtotal.multiply(promo.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            discount = promo.getDiscountValue();
        }

        // Apply maximum discount cap if set
        if (promo.getMaximumDiscount() != null && discount.compareTo(promo.getMaximumDiscount()) > 0) {
            discount = promo.getMaximumDiscount();
        }

        // Discount cannot exceed subtotal
        if (discount.compareTo(subtotal) > 0) {
            discount = subtotal;
        }

        return discount;
    }

    @Transactional
    public void incrementUsage(String code) {
        promoCodeRepository.findByCodeIgnoreCase(code).ifPresent(promo -> {
            promo.setUsedCount(promo.getUsedCount() == null ? 1 : promo.getUsedCount() + 1);
            promoCodeRepository.save(promo);
            log.info("Incremented usage count for promo code: {}", code);
        });
    }

    // Admin methods
    public List<PromoCodeResponse> getAllPromoCodes() {
        return promoCodeRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(PromoCodeResponse::fromEntity)
                .toList();
    }

    @Transactional
    public PromoCodeResponse createPromoCode(CreatePromoCodeRequest request) {
        log.info("Creating promo code: {}", request.getCode());

        if (promoCodeRepository.findByCodeIgnoreCase(request.getCode()).isPresent()) {
            throw new RuntimeException("Promo code already exists");
        }

        PromoCode promo = PromoCode.builder()
                .code(request.getCode().toUpperCase().trim())
                .description(request.getDescription())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minimumOrderAmount(request.getMinimumOrderAmount())
                .maximumDiscount(request.getMaximumDiscount())
                .usageLimit(request.getUsageLimit())
                .usedCount(0)
                .validFrom(request.getValidFrom())
                .validUntil(request.getValidUntil())
                .isActive(true)
                .build();

        promo = promoCodeRepository.save(promo);
        log.info("Promo code created: {}", promo.getId());

        return PromoCodeResponse.fromEntity(promo);
    }

    @Transactional
    public PromoCodeResponse updatePromoCode(Long id, CreatePromoCodeRequest request) {
        PromoCode promo = promoCodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Promo code not found"));

        promo.setDescription(request.getDescription());
        promo.setDiscountType(request.getDiscountType());
        promo.setDiscountValue(request.getDiscountValue());
        promo.setMinimumOrderAmount(request.getMinimumOrderAmount());
        promo.setMaximumDiscount(request.getMaximumDiscount());
        promo.setUsageLimit(request.getUsageLimit());
        promo.setValidFrom(request.getValidFrom());
        promo.setValidUntil(request.getValidUntil());

        promo = promoCodeRepository.save(promo);
        return PromoCodeResponse.fromEntity(promo);
    }

    @Transactional
    public void togglePromoCodeActive(Long id, boolean active) {
        PromoCode promo = promoCodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Promo code not found"));
        promo.setIsActive(active);
        promoCodeRepository.save(promo);
        log.info("Promo code {} set to active: {}", id, active);
    }

    @Transactional
    public void deletePromoCode(Long id) {
        promoCodeRepository.deleteById(id);
        log.info("Promo code deleted: {}", id);
    }
}
