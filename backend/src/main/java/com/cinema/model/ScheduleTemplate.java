package com.cinema.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "schedule_templates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_type", nullable = false, length = 20)
    private DayType dayType;

    @Column(name = "cleaning_minutes", nullable = false)
    @Builder.Default
    private Integer cleaningMinutes = 15;

    @Column(name = "buffer_minutes", nullable = false)
    @Builder.Default
    private Integer bufferMinutes = 10;

    @Column(name = "ads_minutes", nullable = false)
    @Builder.Default
    private Integer adsMinutes = 20;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_by")
    private Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @OrderBy("startTime ASC")
    @Builder.Default
    private List<ScheduleTemplateSlot> slots = new ArrayList<>();

    public enum DayType {
        WEEKDAY, WEEKEND, HOLIDAY
    }

    // Helper to add slot with bidirectional sync
    public void addSlot(ScheduleTemplateSlot slot) {
        slots.add(slot);
        slot.setTemplate(this);
    }

    public void removeSlot(ScheduleTemplateSlot slot) {
        slots.remove(slot);
        slot.setTemplate(null);
    }
}
