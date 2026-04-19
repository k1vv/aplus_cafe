package com.apluscafe.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class DirectCheckoutRequest {

    @NotEmpty(message = "Items are required")
    @Size(max = 50, message = "Cannot checkout more than 50 items at once")
    @Valid
    private List<CheckoutItem> items;

    @Size(max = 255, message = "Customer email must not exceed 255 characters")
    private String customerEmail;

    private Long userId;

    @NotNull(message = "Delivery details are required")
    @Valid
    private DeliveryDetails deliveryDetails;

    @NotNull(message = "Return URL is required")
    @Size(max = 500, message = "Return URL must not exceed 500 characters")
    private String returnUrl;

    @Data
    public static class CheckoutItem {
        @NotNull(message = "Item name is required")
        @Size(max = 255, message = "Item name must not exceed 255 characters")
        private String name;

        @NotNull(message = "Item price is required")
        @DecimalMin(value = "0.01", message = "Price must be at least 0.01")
        @DecimalMax(value = "99999.99", message = "Price must not exceed 99999.99")
        private BigDecimal price;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        @Max(value = 100, message = "Quantity must not exceed 100")
        private Integer quantity;
    }

    @Data
    public static class DeliveryDetails {
        @NotNull(message = "Name is required")
        @Size(max = 255, message = "Name must not exceed 255 characters")
        private String name;

        @NotNull(message = "Phone is required")
        @Size(max = 20, message = "Phone must not exceed 20 characters")
        @Pattern(regexp = "^[0-9+\\-\\s]*$", message = "Phone contains invalid characters")
        private String phone;

        @NotNull(message = "Address is required")
        @Size(max = 500, message = "Address must not exceed 500 characters")
        private String address;

        @Size(max = 500, message = "Notes must not exceed 500 characters")
        private String notes;

        private Boolean contactless = false;
    }
}
