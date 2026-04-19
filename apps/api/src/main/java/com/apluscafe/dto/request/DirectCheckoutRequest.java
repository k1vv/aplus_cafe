package com.apluscafe.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class DirectCheckoutRequest {

    @NotEmpty(message = "Items are required")
    private List<CheckoutItem> items;

    private String customerEmail;
    private Long userId;

    @NotNull(message = "Delivery details are required")
    private DeliveryDetails deliveryDetails;

    @NotNull(message = "Return URL is required")
    private String returnUrl;

    @Data
    public static class CheckoutItem {
        @NotNull(message = "Item name is required")
        private String name;

        @NotNull(message = "Item price is required")
        private BigDecimal price;

        @NotNull(message = "Quantity is required")
        private Integer quantity;
    }

    @Data
    public static class DeliveryDetails {
        @NotNull(message = "Name is required")
        private String name;

        @NotNull(message = "Phone is required")
        private String phone;

        @NotNull(message = "Address is required")
        private String address;

        private String notes;

        private Boolean contactless = false;
    }
}
