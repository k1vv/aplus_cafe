package com.apluscafe.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ApplyPromoRequest {
    @NotBlank(message = "Promo code is required")
    private String code;

    @NotNull(message = "Subtotal is required")
    private BigDecimal subtotal;
}
