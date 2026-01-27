package com.cinema.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TheaterRequest {
    @NotBlank(message = "Tên rạp không được để trống")
    private String name;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String address;

    private String phone;

    @Email(message = "Email không hợp lệ")
    private String email;

    private String description;
    private String imageUrl;
    private String mapUrl;
    private Boolean active;
    private String cityName;
    private Long cityId;
}
