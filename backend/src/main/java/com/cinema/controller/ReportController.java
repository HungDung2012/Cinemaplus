package com.cinema.controller;

import com.cinema.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final BookingRepository bookingRepository;

    @GetMapping("/revenue")
    public ResponseEntity<byte[]> exportRevenueReport(@RequestParam(defaultValue = "30") int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        List<Map<String, Object>> revenueData = bookingRepository.getRevenueByDate(startDate);

        StringBuilder csv = new StringBuilder();
        csv.append("Date,Revenue\n");

        for (Map<String, Object> record : revenueData) {
            String date = record.get("date") != null ? record.get("date").toString() : "";
            String revenue = record.get("revenue") != null ? record.get("revenue").toString() : "0";
            csv.append(date).append(",").append(revenue).append("\n");
        }

        String filename = "revenue_report_" + LocalDate.now() + ".csv";
        byte[] content = csv.toString().getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(content);
    }
}
