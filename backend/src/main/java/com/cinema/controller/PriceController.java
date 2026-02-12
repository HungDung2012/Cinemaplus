package com.cinema.controller;

import com.cinema.dto.response.ApiResponse;
import com.cinema.model.PriceHeader;
import com.cinema.model.PriceLine;
import com.cinema.model.Surcharge;
import com.cinema.repository.PriceHeaderRepository;
import com.cinema.repository.PriceLineRepository;
import com.cinema.repository.SurchargeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/pricing")
// /api/v1/admin
@RequiredArgsConstructor
public class PriceController {

    private final PriceHeaderRepository priceHeaderRepository;
    private final PriceLineRepository priceLineRepository;
    private final SurchargeRepository surchargeRepository;

    // ================== Price Headers (Rate Cards) ==================
    @GetMapping("/headers")
    public ResponseEntity<ApiResponse<List<PriceHeader>>> getAllPriceHeaders() {
        return ResponseEntity.ok(ApiResponse.success(priceHeaderRepository.findAll()));
    }

    @PostMapping("/headers")
    public ResponseEntity<ApiResponse<PriceHeader>> createPriceHeader(
            @RequestBody com.cinema.dto.request.PriceHeaderRequest request) {
        PriceHeader header = new PriceHeader();
        header.setName(request.getName());
        header.setStartDate(request.getStartDate());
        header.setEndDate(request.getEndDate());
        header.setPriority(request.getPriority());
        header.setActive(request.getActive());

        return ResponseEntity.ok(ApiResponse.success(priceHeaderRepository.save(header)));
    }

    @DeleteMapping("/headers/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePriceHeader(@PathVariable Long id) {
        if (!priceHeaderRepository.existsById(id)) {
            throw new com.cinema.exception.ResourceNotFoundException("PriceHeader", "id", id);
        }
        priceHeaderRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ================== Price Lines ==================
    @GetMapping("/headers/{headerId}/lines")
    public ResponseEntity<ApiResponse<List<PriceLine>>> getPriceLinesByHeader(@PathVariable Long headerId) {
        if (!priceHeaderRepository.existsById(headerId)) {
            throw new com.cinema.exception.ResourceNotFoundException("PriceHeader", "id", headerId);
        }
        return ResponseEntity.ok(ApiResponse.success(priceLineRepository.findByPriceHeaderId(headerId)));
    }

    @PostMapping("/headers/{headerId}/lines")
    public ResponseEntity<ApiResponse<PriceLine>> createOrUpdatePriceLine(
            @PathVariable Long headerId,
            @RequestBody com.cinema.dto.request.PriceLineRequest request) {

        PriceHeader header = priceHeaderRepository.findById(headerId)
                .orElseThrow(() -> new com.cinema.exception.ResourceNotFoundException("PriceHeader", "id", headerId));

        // Check if line exists (Upsert Logic)
        PriceLine priceLine = priceLineRepository.findByPriceHeaderIdAndCustomerTypeAndDayTypeAndTimeSlotAndRoomType(
                headerId,
                request.getCustomerType(),
                request.getDayType(),
                request.getTimeSlot(),
                request.getRoomType()).orElse(new PriceLine());

        // Update fields
        priceLine.setPriceHeader(header);
        priceLine.setCustomerType(request.getCustomerType());
        priceLine.setDayType(request.getDayType());
        priceLine.setTimeSlot(request.getTimeSlot());
        priceLine.setRoomType(request.getRoomType());
        priceLine.setPrice(request.getPrice());

        return ResponseEntity.ok(ApiResponse.success(priceLineRepository.save(priceLine)));
    }

    @PostMapping("/headers/{headerId}/lines/batch")
    public ResponseEntity<ApiResponse<List<PriceLine>>> batchUpdatePriceLines(
            @PathVariable Long headerId,
            @RequestBody List<com.cinema.dto.request.PriceLineRequest> requests) {

        PriceHeader header = priceHeaderRepository.findById(headerId)
                .orElseThrow(() -> new com.cinema.exception.ResourceNotFoundException("PriceHeader", "id", headerId));

        List<PriceLine> updatedLines = new java.util.ArrayList<>();

        for (com.cinema.dto.request.PriceLineRequest request : requests) {
            PriceLine priceLine = priceLineRepository
                    .findByPriceHeaderIdAndCustomerTypeAndDayTypeAndTimeSlotAndRoomType(
                            headerId,
                            request.getCustomerType(),
                            request.getDayType(),
                            request.getTimeSlot(),
                            request.getRoomType())
                    .orElse(new PriceLine());

            priceLine.setPriceHeader(header);
            priceLine.setCustomerType(request.getCustomerType());
            priceLine.setDayType(request.getDayType());
            priceLine.setTimeSlot(request.getTimeSlot());
            priceLine.setRoomType(request.getRoomType());
            priceLine.setPrice(request.getPrice());
            updatedLines.add(priceLine);
        }

        return ResponseEntity.ok(ApiResponse.success(priceLineRepository.saveAll(updatedLines)));
    }

    @DeleteMapping("/lines/{lineId}")
    public ResponseEntity<ApiResponse<Void>> deletePriceLine(@PathVariable Long lineId) {
        priceLineRepository.deleteById(lineId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ================== Seat Types (Configuration) ==================
    @GetMapping("/seat-types")
    public ResponseEntity<ApiResponse<List<Surcharge>>> getAllSeatTypes() {
        return ResponseEntity
                .ok(ApiResponse.success(surchargeRepository.findByType(Surcharge.SurchargeType.SEAT_TYPE)));
    }

    @PostMapping("/seat-types")
    public ResponseEntity<ApiResponse<Surcharge>> createSeatType(
            @RequestBody com.cinema.dto.request.SurchargeRequest request) {
        Surcharge surcharge = new Surcharge();
        surcharge.setName(request.getName());
        surcharge.setType(Surcharge.SurchargeType.SEAT_TYPE); // Enforce SEAT_TYPE
        surcharge.setTargetId(request.getCode()); // Use code as targetId for seat types
        surcharge.setAmount(request.getAmount());
        surcharge.setColor(request.getColor());
        surcharge.setCode(request.getCode());
        surcharge.setActive(request.getActive());

        return ResponseEntity.ok(ApiResponse.success(surchargeRepository.save(surcharge)));
    }

    @PutMapping("/seat-types/{id}")
    public ResponseEntity<ApiResponse<Surcharge>> updateSeatType(
            @PathVariable Long id,
            @RequestBody com.cinema.dto.request.SurchargeRequest request) {
        Surcharge surcharge = surchargeRepository.findById(id)
                .orElseThrow(() -> new com.cinema.exception.ResourceNotFoundException("Seat Type", "id", id));

        // Ensure we are only updating a seat type
        if (surcharge.getType() != Surcharge.SurchargeType.SEAT_TYPE) {
            throw new com.cinema.exception.BadRequestException("Invalid seat type id");
        }

        surcharge.setName(request.getName());
        // Type remains SEAT_TYPE
        surcharge.setTargetId(request.getCode());
        surcharge.setAmount(request.getAmount());
        surcharge.setColor(request.getColor());
        surcharge.setCode(request.getCode());
        surcharge.setActive(request.getActive());

        return ResponseEntity.ok(ApiResponse.success(surchargeRepository.save(surcharge)));
    }

    @DeleteMapping("/seat-types/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSeatType(@PathVariable Long id) {
        Surcharge surcharge = surchargeRepository.findById(id)
                .orElseThrow(() -> new com.cinema.exception.ResourceNotFoundException("Seat Type", "id", id));

        if (surcharge.getType() != Surcharge.SurchargeType.SEAT_TYPE) {
            throw new com.cinema.exception.BadRequestException("Invalid seat type id");
        }

        surchargeRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
