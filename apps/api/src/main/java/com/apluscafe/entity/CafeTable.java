package com.apluscafe.entity;

import com.apluscafe.enums.TableShape;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cafe_tables")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CafeTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String tableNumber;

    @Column(nullable = false)
    private Integer capacity;

    // Position for layout visualization (percentage or pixels)
    @Column(nullable = false)
    private Double positionX;

    @Column(nullable = false)
    private Double positionY;

    private String floorSection; // e.g., "indoor", "outdoor", "upstairs"

    @Enumerated(EnumType.STRING)
    private TableShape shape = TableShape.SQUARE;

    @Column(nullable = false)
    private Boolean isActive = true;

    @OneToMany(mappedBy = "table", cascade = CascadeType.ALL)
    private List<Reservation> reservations = new ArrayList<>();
}
