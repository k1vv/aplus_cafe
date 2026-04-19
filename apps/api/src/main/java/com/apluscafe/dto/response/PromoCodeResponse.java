package com.apluscafe.dto.response;

import com.apluscafe.entity.PromoCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromoCodeResponse {
    private Long id;
    private String code;
    private String description;
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal minimumOrderAmount;
    private BigDecimal maximumDiscount;
    private Integer usageLimit;
    private Integer usedCount;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public static PromoCodeResponse fromEntity(PromoCode promo) {
        return PromoCodeResponse.builder()
                .id(promo.getId())
                .code(promo.getCode())
                .description(promo.getDescription())
                .discountType(promo.getDiscountType().name())
                .discountValue(promo.getDiscountValue())
                .minimumOrderAmount(promo.getMinimumOrderAmount())
                .maximumDiscount(promo.getMaximumDiscount())
                .usageLimit(promo.getUsageLimit())
                .usedCount(promo.getUsedCount())
                .validFrom(promo.getValidFrom())
                .validUntil(promo.getValidUntil())
                .isActive(promo.getIsActive())
                .createdAt(promo.getCreatedAt())
                .build();
    }
}
