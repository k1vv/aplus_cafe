package com.apluscafe.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String label; // e.g., "Home", "Work"

    @Column(nullable = false)
    private String addressLine;

    private String city;

    private String postalCode;

    private Double latitude;

    private Double longitude;

    @Column(nullable = false)
    private Boolean isDefault = false;
}
