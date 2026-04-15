package com.apluscafe.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateCheckoutRequest {

    @NotNull(message = "Order ID is required")
    private Long orderId;

    private String successUrl;

    private String cancelUrl;
}
