package com.cinema.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
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

    @OneToMany(mappedBy = "region", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<City> cities = new ArrayList<>();

    /**
     * Helper method để lấy tất cả theaters trong region thông qua cities
     */
    public List<Theater> getAllTheaters() {
        List<Theater> allTheaters = new ArrayList<>();
        if (cities != null) {
            for (City city : cities) {
                if (city.getTheaters() != null) {
                    allTheaters.addAll(city.getTheaters());
                }
            }
        }
        return allTheaters;
    }
}
