package com.cinema.controller;

import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.TheaterResponse;
import com.cinema.service.TheaterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/theaters")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminTheaterController {

    private final TheaterService theaterService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TheaterResponse>>> getTheaters() {
        List<TheaterResponse> list = theaterService.getAllTheaters();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TheaterResponse>> getTheaterById(@PathVariable Long id) {
        TheaterResponse t = theaterService.getTheaterById(id);
        return ResponseEntity.ok(ApiResponse.success(t));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TheaterResponse>> createTheater(
            @Valid @RequestBody com.cinema.dto.request.TheaterRequest request) {
        TheaterResponse theater = theaterService.createTheater(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Theater created", theater));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TheaterResponse>> updateTheater(@PathVariable Long id,
            @Valid @RequestBody com.cinema.dto.request.TheaterRequest request) {
        TheaterResponse theater = theaterService.updateTheater(id, request);
        return ResponseEntity.ok(ApiResponse.success("Theater updated", theater));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTheater(@PathVariable Long id) {
        theaterService.deleteTheater(id);
        return ResponseEntity.ok(ApiResponse.success("Theater deleted", null));
    }
}
