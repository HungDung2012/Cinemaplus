package com.cinema.controller;

import com.cinema.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('VIEW_REPORTS')")
public class ReportController {

    private final AnalyticsService analyticsService;

    // UTF-8 BOM to ensure Excel on Windows opens Vietnamese text correctly
    private static final String BOM = "\uFEFF";

    // =================== REVENUE REPORT ===================

    @GetMapping("/revenue")
    public ResponseEntity<byte[]> exportRevenueReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "30") int days) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(days);

        List<Map<String, Object>> data = analyticsService.getRevenueByDate(start, end);

        StringBuilder csv = new StringBuilder(BOM);
        csv.append("Ngày,Doanh Thu (VNĐ),Số Đơn\n");
        for (Map<String, Object> r : data) {
            csv.append(safe(r, "date")).append(",")
               .append(safe(r, "revenue")).append(",")
               .append(safe(r, "bookingCount")).append("\n");
        }

        return csvResponse(csv, "bao_cao_doanh_thu_" + LocalDate.now() + ".csv");
    }

    // =================== MOVIES REPORT ===================

    @GetMapping("/movies")
    public ResponseEntity<byte[]> exportMoviesReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "50") int limit) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(30);

        List<Map<String, Object>> data = analyticsService.getRevenueByMovie(start, end, limit);

        StringBuilder csv = new StringBuilder(BOM);
        csv.append("Tên Phim,Doanh Thu (VNĐ),Số Đơn,Số Vé\n");
        for (Map<String, Object> r : data) {
            csv.append(escapeCsv(safe(r, "movieTitle"))).append(",")
               .append(safe(r, "revenue")).append(",")
               .append(safe(r, "bookingCount")).append(",")
               .append(safe(r, "ticketCount")).append("\n");
        }

        return csvResponse(csv, "bao_cao_phim_" + LocalDate.now() + ".csv");
    }

    // =================== THEATERS REPORT ===================

    @GetMapping("/theaters")
    public ResponseEntity<byte[]> exportTheatersReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(30);

        List<Map<String, Object>> data = analyticsService.getRevenueByTheater(start, end);

        StringBuilder csv = new StringBuilder(BOM);
        csv.append("Tên Rạp,Doanh Thu (VNĐ),Số Đơn,Số Vé\n");
        for (Map<String, Object> r : data) {
            csv.append(escapeCsv(safe(r, "theaterName"))).append(",")
               .append(safe(r, "revenue")).append(",")
               .append(safe(r, "bookingCount")).append(",")
               .append(safe(r, "ticketCount")).append("\n");
        }

        return csvResponse(csv, "bao_cao_rap_" + LocalDate.now() + ".csv");
    }

    // =================== TOP CUSTOMERS REPORT ===================

    @GetMapping("/customers")
    public ResponseEntity<byte[]> exportCustomersReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "100") int limit) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : null;

        List<Map<String, Object>> data = analyticsService.getTopCustomers(start, end, limit);

        StringBuilder csv = new StringBuilder(BOM);
        csv.append("Họ Tên,Email,Tổng Chi Tiêu (VNĐ),Số Đơn\n");
        for (Map<String, Object> r : data) {
            csv.append(escapeCsv(safe(r, "fullName"))).append(",")
               .append(escapeCsv(safe(r, "email"))).append(",")
               .append(safe(r, "totalSpent")).append(",")
               .append(safe(r, "bookingCount")).append("\n");
        }

        return csvResponse(csv, "top_khach_hang_" + LocalDate.now() + ".csv");
    }

    // =================== F&B REPORT ===================

    @GetMapping("/food")
    public ResponseEntity<byte[]> exportFoodReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "50") int limit) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(30);

        List<Map<String, Object>> data = analyticsService.getTopSellingFoods(start, end, limit);

        StringBuilder csv = new StringBuilder(BOM);
        csv.append("Tên Sản Phẩm,Danh Mục,Số Lượng Bán,Doanh Thu (VNĐ)\n");
        for (Map<String, Object> r : data) {
            csv.append(escapeCsv(safe(r, "foodName"))).append(",")
               .append(escapeCsv(safe(r, "category"))).append(",")
               .append(safe(r, "totalQuantity")).append(",")
               .append(safe(r, "totalRevenue")).append("\n");
        }

        return csvResponse(csv, "bao_cao_fb_" + LocalDate.now() + ".csv");
    }

    // =================== HELPERS ===================

    private String safe(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : "";
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private ResponseEntity<byte[]> csvResponse(StringBuilder csv, String filename) {
        byte[] content = csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename*=UTF-8''" + filename + "; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(content);
    }
}
