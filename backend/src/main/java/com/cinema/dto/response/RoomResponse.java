package com.cinema.dto.response;

import com.cinema.model.Room;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {
    private Long id;
    private String name;
    private Integer totalSeats;
    private Integer rowsCount;
    private Integer columnsCount;
    private Room.RoomType roomType;
    private Boolean active;
    private Long theaterId;
    private String theaterName;
}
