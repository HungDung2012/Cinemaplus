package com.cinema.repository;

import com.cinema.model.ScheduleTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduleTemplateRepository extends JpaRepository<ScheduleTemplate, Long> {

    List<ScheduleTemplate> findByActiveTrue();

    List<ScheduleTemplate> findByDayTypeAndActiveTrue(ScheduleTemplate.DayType dayType);

    @Query("SELECT t FROM ScheduleTemplate t LEFT JOIN FETCH t.slots WHERE t.id = :id")
    java.util.Optional<ScheduleTemplate> findByIdWithSlots(@Param("id") Long id);

    @Query("SELECT DISTINCT t FROM ScheduleTemplate t LEFT JOIN FETCH t.slots WHERE t.active = true ORDER BY t.dayType, t.name")
    List<ScheduleTemplate> findAllActiveWithSlots();

    boolean existsByNameAndIdNot(String name, Long id);

    boolean existsByName(String name);
}
