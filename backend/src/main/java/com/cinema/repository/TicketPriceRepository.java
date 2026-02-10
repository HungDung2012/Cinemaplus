package com.cinema.repository;

import com.cinema.model.TicketPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketPriceRepository extends JpaRepository<TicketPrice, Long> {

    @Query("SELECT tp FROM TicketPrice tp WHERE tp.active = true " +
            "ORDER BY tp.priority DESC")
    List<TicketPrice> findAllActiveRules();
}
