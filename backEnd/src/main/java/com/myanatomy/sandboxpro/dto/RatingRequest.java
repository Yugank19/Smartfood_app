package com.myanatomy.sandboxpro.dto;

import lombok.Data;

@Data
public class RatingRequest {
    private String donorPhone;   // phone of the donor being rated
    private Long pickupRequestId; // optional - link to specific pickup
    private int score;           // 1-5
    private String feedback;
}
