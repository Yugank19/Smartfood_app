package com.myanatomy.sandboxpro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ActivityLogDTO {
    private Long id;
    private String action;
    private String type;       // "registration", "listing", "pickup", "delivery"
    private LocalDateTime timestamp;
    private String actorName;
}
