package com.cinema.dto;

import com.cinema.model.Room;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomDTO {
    private Long id;
    private String name;
    private Integer totalSeats;
    private Integer rowsCount;
    private Integer columnsCount;
    private Room.RoomType roomType;
    private Boolean active;
    private Long theaterId;
    private String theaterName;

    @Builder.Default
    private List<SeatDTO> seats = new ArrayList<>();
}
