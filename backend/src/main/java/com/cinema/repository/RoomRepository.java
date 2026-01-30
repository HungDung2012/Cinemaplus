package com.cinema.repository;

import com.cinema.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    @Query("SELECT r FROM Room r LEFT JOIN FETCH r.seats WHERE r.id = :id")
    Optional<Room> findByIdWithSeats(@Param("id") Long id);

    List<Room> findByTheaterId(Long theaterId);

    List<Room> findByTheaterIdAndActiveTrue(Long theaterId);

    List<Room> findByRoomType(Room.RoomType roomType);
}
