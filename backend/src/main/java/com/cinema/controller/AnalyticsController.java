package com.cinema.controller;

import com.cinema.dto.response.ApiResponse;
import com.cinema.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final BookingRepository bookingRepository;

    @GetMapping("/overall")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOverallStats() {
        return ResponseEntity.ok(ApiResponse.success(bookingRepository.getOverallStats()));
    }

    @GetMapping("/movies")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRevenueByMovie(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success(
                bookingRepository.getRevenueByMovie(PageRequest.of(0, limit))));
    }

    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRevenueByDate(
            @RequestParam(defaultValue = "30") int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        return ResponseEntity.ok(ApiResponse.success(
                bookingRepository.getRevenueByDate(startDate)));
    }
}
