package com.apluscafe.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rider_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiderDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String vehicleType;

    private String licensePlate;

    @Column(nullable = false)
    private Boolean isAvailable = true;

    private Double currentLatitude;

    private Double currentLongitude;

    private Double rating = 5.0;

    @Column(nullable = false)
    private Integer totalDeliveries = 0;

    @OneToMany(mappedBy = "rider", cascade = CascadeType.ALL)
    private List<Delivery> deliveries = new ArrayList<>();
}
