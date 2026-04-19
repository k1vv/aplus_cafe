package com.apluscafe.dto.request;

import com.apluscafe.enums.OrderType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateOrderRequest {

    @NotEmpty(message = "Order items are required")
    private List<OrderItemRequest> items;

    @NotNull(message = "Order type is required")
    private OrderType orderType;

    private Long addressId;

    private DeliveryDetailsRequest deliveryDetails;

    private String notes;

    @Data
    public static class OrderItemRequest {
        @NotNull(message = "Menu ID is required")
        private Long menuId;

        @NotNull(message = "Quantity is required")
        private Integer quantity;

        private String specialInstructions;
    }

    @Data
    public static class DeliveryDetailsRequest {
        private String address;
        private String phone;
        private String notes;
        private Boolean contactless = false;
    }
}
