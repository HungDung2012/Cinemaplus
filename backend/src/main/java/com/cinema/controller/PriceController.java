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

    @DeleteMapping("/lines/{lineId}")
    public ResponseEntity<ApiResponse<Void>> deletePriceLine(@PathVariable Long lineId) {
        priceLineRepository.deleteById(lineId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ================== Surcharges (Including Seat Types) ==================
    @GetMapping("/surcharges")
    public ResponseEntity<ApiResponse<List<Surcharge>>> getAllSurcharges() {
        return ResponseEntity.ok(ApiResponse.success(surchargeRepository.findAll()));
    }

    @PostMapping("/surcharges")
    public ResponseEntity<ApiResponse<Surcharge>> createSurcharge(
            @RequestBody com.cinema.dto.request.SurchargeRequest request) {
        Surcharge surcharge = new Surcharge();
        surcharge.setName(request.getName());
        surcharge.setType(request.getType());
        surcharge.setTargetId(request.getTargetId());
        surcharge.setAmount(request.getAmount());
        surcharge.setColor(request.getColor()); // Set color from DTO
        surcharge.setCode(request.getCode());
        surcharge.setActive(request.getActive());
        // Handle color if present (needs DTO update or just set from request if
        // flexible)
        // Since I'm using DTO, I should update DTO too.

        return ResponseEntity.ok(ApiResponse.success(surchargeRepository.save(surcharge)));
    }

    @DeleteMapping("/surcharges/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSurcharge(@PathVariable Long id) {
        surchargeRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ================== Seat Types (Configuration) ==================
    // Now handled via Surcharges with type=SEAT_TYPE
    // We can keep these endpoints for frontend compatibility but map them to
    // Surcharge logic

    @GetMapping("/seat-types")
    public ResponseEntity<ApiResponse<List<Surcharge>>> getAllSeatTypes() {
        // Return only surcharges of type SEAT_TYPE
        return ResponseEntity
                .ok(ApiResponse.success(surchargeRepository.findByType(Surcharge.SurchargeType.SEAT_TYPE)));
    }

    // NOTE: SurchargeRepository needs findByType method

}
