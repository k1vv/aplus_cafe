package com.apluscafe.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ApplyPromoRequest {
    @NotBlank(message = "Promo code is required")
    @Size(max = 50, message = "Promo code must not exceed 50 characters")
    private String code;

    @NotNull(message = "Subtotal is required")
    @DecimalMin(value = "0", message = "Subtotal cannot be negative")
    @DecimalMax(value = "99999.99", message = "Subtotal must not exceed 99999.99")
    private BigDecimal subtotal;
}
