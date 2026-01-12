package com.cinema.repository;

import com.cinema.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByTheaterId(Long theaterId);
    List<Room> findByTheaterIdAndActiveTrue(Long theaterId);
    List<Room> findByRoomType(Room.RoomType roomType);
}
