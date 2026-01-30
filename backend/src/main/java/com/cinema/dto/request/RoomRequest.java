package com.cinema.dto.request;

import com.cinema.model.Room;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomRequest {
    @NotBlank(message = "Room name is required")
    private String name;

    @NotNull(message = "Theater ID is required")
    private Long theaterId;

    private Integer rowsCount;
    private Integer columnsCount;

    private Room.RoomType roomType;

    private Boolean active;

    private com.fasterxml.jackson.databind.JsonNode seatLayout; // Can be JSON string or Object from frontend
}
