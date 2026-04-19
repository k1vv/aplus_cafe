package com.apluscafe.enums;

public enum DeliveryStatus {
    PENDING_ASSIGNMENT,
    ASSIGNED,
    PICKED_UP,
    IN_TRANSIT,
    DELIVERED,
    CANCELLED;

    public boolean isActive() {
        return this == ASSIGNED || this == PICKED_UP || this == IN_TRANSIT;
    }
}
