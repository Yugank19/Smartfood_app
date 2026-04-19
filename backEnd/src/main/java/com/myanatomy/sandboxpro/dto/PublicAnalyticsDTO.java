package com.myanatomy.sandboxpro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PublicAnalyticsDTO {
    private long totalMealsSaved;
    private long activeDonors;
}
