package com.myanatomy.sandboxpro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminAnalyticsDTO {
    private long totalMealsSaved;
    private long totalDeliveries;
    private long activeDonors;
    private long activeNGOs;
    private long activeVolunteers;
}
