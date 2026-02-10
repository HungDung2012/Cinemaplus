package com.cinema.controller;

import com.cinema.dto.response.ApiResponse;
import com.cinema.model.PriceHeader;
import com.cinema.model.PriceLine;
import com.cinema.model.Surcharge;
import com.cinema.repository.PriceHeaderRepository;
import com.cinema.repository.PriceLineRepository;
import com.cinema.repository.SurchargeRepository;
import com.cinema.repository.SeatTypeRepository;
import com.cinema.model.SeatType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/pricing") // Changed path to include /pricing subset or keep /admin? The previous was
                                         // /api/v1/admin
@RequiredArgsConstructor
public class PriceController {

    private final PriceHeaderRepository priceHeaderRepository;
    private final PriceLineRepository priceLineRepository;
    private final SurchargeRepository surchargeRepository;
    private final SeatTypeRepository seatTypeRepository;

    // ================== Price Headers (Rate Cards) ==================
    @GetMapping("/headers")
    public ResponseEntity<ApiResponse<List<PriceHeader>>> getAllPriceHeaders() {
        return ResponseEntity.ok(ApiResponse.success(priceHeaderRepository.findAll()));
    }

    // ... (unchanged methods) ...

    @PostMapping("/headers")
    public ResponseEntity<ApiResponse<PriceHeader>> createPriceHeader(@RequestBody PriceHeader priceHeader) {
        return ResponseEntity.ok(ApiResponse.success(priceHeaderRepository.save(priceHeader)));
    }

    // ================== Price Lines ==================
    @GetMapping("/headers/{headerId}/lines")
    public ResponseEntity<ApiResponse<List<PriceLine>>> getPriceLinesByHeader(@PathVariable Long headerId) {
        if (!priceHeaderRepository.existsById(headerId)) {
            throw new RuntimeException("Price header not found");
        }
        return ResponseEntity.ok(ApiResponse.success(priceLineRepository.findByPriceHeaderId(headerId)));
    }

    @PostMapping("/headers/{headerId}/lines")
    public ResponseEntity<ApiResponse<PriceLine>> createPriceLine(@PathVariable Long headerId,
            @RequestBody PriceLine priceLine) {
        PriceHeader header = priceHeaderRepository.findById(headerId)
                .orElseThrow(() -> new RuntimeException("Price header not found"));
        priceLine.setPriceHeader(header);
        return ResponseEntity.ok(ApiResponse.success(priceLineRepository.save(priceLine)));
    }

    @DeleteMapping("/lines/{lineId}")
    public ResponseEntity<ApiResponse<Void>> deletePriceLine(@PathVariable Long lineId) {
        priceLineRepository.deleteById(lineId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ================== Surcharges ==================
    @GetMapping("/surcharges")
    public ResponseEntity<ApiResponse<List<Surcharge>>> getAllSurcharges() {
        return ResponseEntity.ok(ApiResponse.success(surchargeRepository.findAll()));
    }

    @PostMapping("/surcharges")
    public ResponseEntity<ApiResponse<Surcharge>> createSurcharge(@RequestBody Surcharge surcharge) {
        return ResponseEntity.ok(ApiResponse.success(surchargeRepository.save(surcharge)));
    }

    @DeleteMapping("/surcharges/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSurcharge(@PathVariable Long id) {
        surchargeRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ================== Seat Types (Configuration) ==================
    @GetMapping("/seat-types")
    public ResponseEntity<ApiResponse<List<SeatType>>> getAllSeatTypes() {
        return ResponseEntity.ok(ApiResponse.success(seatTypeRepository.findAll()));
    }

    @PostMapping("/seat-types")
    public ResponseEntity<ApiResponse<SeatType>> createSeatType(@RequestBody SeatType seatType) {
        return ResponseEntity.ok(ApiResponse.success(seatTypeRepository.save(seatType)));
    }

    @DeleteMapping("/seat-types/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSeatType(@PathVariable Long id) {
        seatTypeRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

}
