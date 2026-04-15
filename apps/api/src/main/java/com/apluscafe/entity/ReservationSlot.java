package com.apluscafe.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "reservation_slots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalTime startTime; // e.g., 09:00, 09:30, 10:00

    @Column(nullable = false)
    private Boolean isActive = true;

    // Day of week (0 = Sunday, 6 = Saturday), null means all days
    private Integer dayOfWeek;
}
