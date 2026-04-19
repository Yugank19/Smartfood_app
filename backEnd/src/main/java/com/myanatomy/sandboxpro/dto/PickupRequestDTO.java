package com.myanatomy.sandboxpro.dto;

import com.myanatomy.sandboxpro.model.PickupRequest;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PickupRequestDTO {
    private Long id;
    private Long foodListingId;
    private String foodType;
    private String quantity;
    private String location;
    private String ngoName;
    private String volunteerName;
    private PickupRequest.Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PickupRequestDTO from(PickupRequest pr) {
        PickupRequestDTO dto = new PickupRequestDTO();
        dto.setId(pr.getId());
        dto.setFoodListingId(pr.getFoodListing().getId());
        dto.setFoodType(pr.getFoodListing().getFoodType());
        dto.setQuantity(pr.getFoodListing().getQuantity());
        dto.setLocation(pr.getFoodListing().getLocation());
        dto.setNgoName(pr.getNgo().getFullName());
        dto.setVolunteerName(pr.getVolunteer() != null ? pr.getVolunteer().getFullName() : null);
        dto.setStatus(pr.getStatus());
        dto.setCreatedAt(pr.getCreatedAt());
        dto.setUpdatedAt(pr.getUpdatedAt());
        return dto;
    }
}
