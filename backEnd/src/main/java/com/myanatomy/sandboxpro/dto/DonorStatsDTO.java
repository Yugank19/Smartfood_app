package com.myanatomy.sandboxpro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DonorStatsDTO {
    private long mealsShared;       // count of DELIVERED listings by this donor
    private long activeListings;    // count of AVAILABLE listings by this donor
    private long totalListings;     // all-time total listings
    private double co2OffsetTons;   // estimated: mealsShared * 0.0004 tons per meal
}
