package com.cinema.service;

import com.cinema.dto.RoomDTO;
import com.cinema.dto.response.RoomResponse;
import com.cinema.exception.ResourceNotFoundException;
import com.cinema.model.Room;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional
public class RoomService {

    private final com.cinema.repository.RoomRepository roomRepository;
    private final com.cinema.repository.TheaterRepository theaterRepository;
    private final com.cinema.repository.SurchargeRepository surchargeRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    public RoomDTO createRoom(com.cinema.dto.request.RoomRequest request) {
        com.cinema.model.Theater theater = theaterRepository.findById(request.getTheaterId())
                .orElseThrow(() -> new ResourceNotFoundException("Theater", "id", request.getTheaterId()));

        Room room = Room.builder()
                .name(request.getName())
                .theater(theater)
                .rowsCount(request.getRowsCount())
                .columnsCount(request.getColumnsCount())
                .roomType(request.getRoomType() != null ? request.getRoomType() : Room.RoomType.STANDARD_2D)
                .active(request.getActive() != null ? request.getActive() : true)
                .active(request.getActive() != null ? request.getActive() : true)
                .seatLayout(request.getSeatLayout() != null ? convertLayoutToString(request.getSeatLayout()) : null)
                .totalSeats(0) // Initialize with 0
                .build();

        room = roomRepository.save(room);

        if (request.getSeatLayout() != null) {
            syncSeatsFromLayout(room, convertLayoutToString(request.getSeatLayout()));
        }

        // Refresh to get seats
        return getRoomLayout(room.getId());
    }

    public RoomDTO updateRoom(Long id, com.cinema.dto.request.RoomRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", id));

        room.setName(request.getName());
        room.setRowsCount(request.getRowsCount());
        room.setColumnsCount(request.getColumnsCount());
        if (request.getRoomType() != null)
            room.setRoomType(request.getRoomType());
        if (request.getActive() != null)
            room.setActive(request.getActive());

        // Check if layout changed or re-sync requested
        if (request.getSeatLayout() != null) {
            String layoutStr = convertLayoutToString(request.getSeatLayout());
            room.setSeatLayout(layoutStr);
            syncSeatsFromLayout(room, layoutStr);
        }

        roomRepository.save(room);
        return getRoomLayout(room.getId());
    }

    public void deleteRoom(Long id) {
        if (!roomRepository.existsById(id)) {
            throw new ResourceNotFoundException("Room", "id", id);
        }
        roomRepository.deleteById(id);
    }

    private void syncSeatsFromLayout(Room room, String layoutJson) {
        try {
            com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(layoutJson);
            com.fasterxml.jackson.databind.JsonNode gridNode = root.get("grid");

            if (gridNode == null || !gridNode.isArray()) {
                return;
            }

            // Remove old seats (or we could try to diff, but simple replacement is safer
            // for now)
            // seatRepository.deleteByRoomId(room.getId()); // Need to impl this or use
            // deleteInBatch
            // Since we have CascadeType.ALL and orphanRemoval might not be set, we manually
            // clear or use batch delete
            // For now, let's clear the list if we rely on Cascade, or use repository delete

            // To properly update, we should fetch existing seats, map them, and
            // update/create/delete
            // But strict replacement:
            room.getSeats().clear();
            roomRepository.saveAndFlush(room); // Flush delete to avoid unique constraint violation

            List<com.cinema.model.Seat> newSeats = new java.util.ArrayList<>();

            // Fetch all available Surcharges of type SEAT_TYPE to minimize DB calls
            java.util.Map<String, com.cinema.model.Surcharge> seatTypeMap = surchargeRepository
                    .findByType(com.cinema.model.Surcharge.SurchargeType.SEAT_TYPE).stream()
                    .collect(java.util.stream.Collectors.toMap(s -> s.getCode() != null ? s.getCode() : s.getName(),
                            s -> s));

            for (com.fasterxml.jackson.databind.JsonNode rowNode : gridNode) {
                for (com.fasterxml.jackson.databind.JsonNode cellNode : rowNode) {
                    String typeCode = cellNode.get("type").asText();
                    if ("NONE".equals(typeCode))
                        continue;

                    int rowIdx = cellNode.get("row").asInt();
                    int colIdx = cellNode.get("col").asInt();

                    String rowName = String.valueOf((char) ('A' + rowIdx));
                    int seatNumber = colIdx + 1;

                    // Find or create Surcharge (as SeatType)
                    com.cinema.model.Surcharge surchargeObj = seatTypeMap.computeIfAbsent(typeCode, k -> {
                        // Create default if not exists (fallback)
                        com.cinema.model.Surcharge newType = com.cinema.model.Surcharge.builder()
                                .name(k) // Default name = code
                                .code(k)
                                .type(com.cinema.model.Surcharge.SurchargeType.SEAT_TYPE)
                                .targetId(k) // Redundant but consistent
                                .amount(java.math.BigDecimal.ZERO)
                                .active(true)
                                .build();
                        return surchargeRepository.save(newType);
                    });

                    com.cinema.model.Seat seat = com.cinema.model.Seat.builder()
                            .room(room)
                            .rowName(rowName)
                            .seatNumber(seatNumber)
                            .seatType(surchargeObj)
                            .active(true)
                            .build();

                    newSeats.add(seat);
                }
            }

            room.getSeats().addAll(newSeats);
            room.setTotalSeats(newSeats.size()); // Update total seats count
            roomRepository.save(room);

        } catch (Exception e) {
            throw new com.cinema.exception.BadRequestException("Invalid seat layout JSON: " + e.getMessage());
        }
    }

    private String convertLayoutToString(com.fasterxml.jackson.databind.JsonNode jsonNode) {
        if (jsonNode == null)
            return null;
        if (jsonNode.isTextual()) {
            return jsonNode.asText();
        }
        return jsonNode.toString();
    }

    public RoomDTO getRoomLayout(Long roomId) {
        Room room = roomRepository.findByIdWithSeats(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", roomId));
        return mapRoomToDTO(room);
    }

    public List<RoomResponse> getRoomsByTheater(Long theaterId) {
        return roomRepository.findByTheaterIdAndActiveTrue(theaterId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<RoomResponse> getAllRooms() {
        return roomRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public RoomResponse getRoomById(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", id));
        return mapToResponse(room);
    }

    // ... existing map methods update

    // Duplicated method from previous step, ensure we don't double paste
    // (Content replacement handles duplication if we select correct bounds)

    private RoomResponse mapToResponse(Room room) {
        return RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .totalSeats(room.getTotalSeats())
                .rowsCount(room.getRowsCount())
                .columnsCount(room.getColumnsCount())
                .roomType(room.getRoomType())
                .active(room.getActive())
                .theaterId(room.getTheater().getId())
                .theaterName(room.getTheater().getName())
                .build();
    }

    private RoomDTO mapRoomToDTO(Room room) {
        return RoomDTO.builder()
                .id(room.getId())
                .name(room.getName())
                .totalSeats(room.getTotalSeats())
                .rowsCount(room.getRowsCount())
                .columnsCount(room.getColumnsCount())
                .roomType(room.getRoomType())
                .active(room.getActive())
                .theaterId(room.getTheater().getId())
                .theaterName(room.getTheater().getName())
                .seats(room.getSeats().stream()
                        .map(this::mapSeatToDTO)
                        .collect(Collectors.toList()))
                .build();
    }

    private com.cinema.dto.SeatDTO mapSeatToDTO(com.cinema.model.Seat seat) {
        com.cinema.model.Surcharge type = seat.getSeatType();
        return com.cinema.dto.SeatDTO.builder()
                .id(seat.getId())
                .rowName(seat.getRowName())
                .seatNumber(seat.getSeatNumber())
                .seatTypeCode(type != null ? type.getCode() : "STANDARD")
                .seatTypeName(type != null ? type.getName() : "Ghế Thường")
                .priceMultiplier(java.math.BigDecimal.ONE) // Deprecated mechanism
                .extraFee(type != null ? type.getAmount() : java.math.BigDecimal.ZERO)
                .seatColor(type != null ? type.getColor() : null)
                .active(seat.getActive())
                .build();
    }
}
