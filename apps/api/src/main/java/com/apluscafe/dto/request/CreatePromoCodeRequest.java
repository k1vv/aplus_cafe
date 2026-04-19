package com.apluscafe.dto.request;

import com.apluscafe.enums.DiscountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CreatePromoCodeRequest {
    @NotBlank(message = "Code is required")
    @Size(max = 50, message = "Code must not exceed 50 characters")
    @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Code can only contain uppercase letters, numbers, underscores and hyphens")
    private String code;

    @Size(max = 255, message = "Description must not exceed 255 characters")
    private String description;

    @NotNull(message = "Discount type is required")
    private DiscountType discountType;

    @NotNull(message = "Discount value is required")
    @DecimalMin(value = "0.01", message = "Discount value must be at least 0.01")
    @DecimalMax(value = "99999.99", message = "Discount value must not exceed 99999.99")
    private BigDecimal discountValue;

    @DecimalMin(value = "0", message = "Minimum order amount cannot be negative")
    @DecimalMax(value = "99999.99", message = "Minimum order amount must not exceed 99999.99")
    private BigDecimal minimumOrderAmount;

    @DecimalMin(value = "0", message = "Maximum discount cannot be negative")
    @DecimalMax(value = "99999.99", message = "Maximum discount must not exceed 99999.99")
    private BigDecimal maximumDiscount;

    @Min(value = 1, message = "Usage limit must be at least 1")
    @Max(value = 1000000, message = "Usage limit must not exceed 1000000")
    private Integer usageLimit;

    private LocalDateTime validFrom;

    private LocalDateTime validUntil;
}
