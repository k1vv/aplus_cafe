package com.apluscafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromoValidationResponse {
    private boolean valid;
    private String code;
    private String description;
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal discountAmount;
    private String errorMessage;

    public static PromoValidationResponse invalid(String message) {
        return PromoValidationResponse.builder()
                .valid(false)
                .errorMessage(message)
                .build();
    }
}
