package com.cinema.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogFilterOptionsResponse {
    private List<String> actions;
    private List<String> entityNames;
    private List<String> usernames;
    private List<String> roles;
}
