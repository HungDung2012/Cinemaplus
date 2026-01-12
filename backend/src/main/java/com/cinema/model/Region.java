package com.cinema.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "regions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Region {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // Miền Bắc, Miền Trung, Miền Nam

    @Column(nullable = false, unique = true)
    private String code; // NORTH, CENTRAL, SOUTH

    @OneToMany(mappedBy = "region")
    private List<Theater> theaters;
}
