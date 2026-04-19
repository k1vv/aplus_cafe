package com.apluscafe.dto.request;

import com.apluscafe.enums.OrderType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreateOrderRequest {

    @NotEmpty(message = "Order items are required")
    @Size(max = 50, message = "Cannot order more than 50 items at once")
    @Valid
    private List<OrderItemRequest> items;

    @NotNull(message = "Order type is required")
    private OrderType orderType;

    private Long addressId;

    @Valid
    private DeliveryDetailsRequest deliveryDetails;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;

    @Data
    public static class OrderItemRequest {
        @NotNull(message = "Menu ID is required")
        private Long menuId;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        @Max(value = 100, message = "Quantity must not exceed 100")
        private Integer quantity;

        @Size(max = 500, message = "Special instructions must not exceed 500 characters")
        private String specialInstructions;
    }

    @Data
    public static class DeliveryDetailsRequest {
        @Size(max = 500, message = "Address must not exceed 500 characters")
        private String address;

        @Size(max = 20, message = "Phone must not exceed 20 characters")
        @Pattern(regexp = "^[0-9+\\-\\s]*$", message = "Phone contains invalid characters")
        private String phone;

        @Size(max = 500, message = "Notes must not exceed 500 characters")
        private String notes;

        private Boolean contactless = false;
    }
}
