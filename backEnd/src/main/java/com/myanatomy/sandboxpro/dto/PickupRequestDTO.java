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
    private Double latitude;
    private Double longitude;
    private java.util.List<String> imageUrls;         // F1: food images
    private String pickupProofImageUrl;       // F3: proof of pickup
    private String deliveryProofImageUrl;     // F3: proof of delivery
    private String ngoName;
    private String ngoPhone;
    private String volunteerName;
    private String volunteerPhone;
    private String donorName;                 // F4/F6: donor info
    private String donorPhone;
    private Long chatRoomId;                  // F4: chat
    private PickupRequest.Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // F2: pickup time slot
    private LocalDateTime pickupStartTime;
    private LocalDateTime pickupEndTime;

    public static PickupRequestDTO from(PickupRequest pr) {
        PickupRequestDTO dto = new PickupRequestDTO();
        dto.setId(pr.getId());
        dto.setFoodListingId(pr.getFoodListing().getId());
        dto.setFoodType(pr.getFoodListing().getFoodType());
        dto.setQuantity(pr.getFoodListing().getQuantity());
        dto.setLocation(pr.getFoodListing().getLocation());
        dto.setLatitude(pr.getFoodListing().getLatitude());
        dto.setLongitude(pr.getFoodListing().getLongitude());
        dto.setImageUrls(pr.getFoodListing().getImageUrls());
        dto.setPickupProofImageUrl(pr.getPickupProofImageUrl());
        dto.setDeliveryProofImageUrl(pr.getDeliveryProofImageUrl());
        dto.setNgoName(pr.getNgo().getFullName());
        dto.setNgoPhone(pr.getNgo().getPhone());
        dto.setVolunteerName(pr.getVolunteer() != null ? pr.getVolunteer().getFullName() : null);
        dto.setVolunteerPhone(pr.getVolunteer() != null ? pr.getVolunteer().getPhone() : null);
        dto.setDonorName(pr.getFoodListing().getDonor().getFullName());
        dto.setDonorPhone(pr.getFoodListing().getDonor().getPhone());
        dto.setChatRoomId(pr.getChatRoomId());
        dto.setStatus(pr.getStatus());
        dto.setCreatedAt(pr.getCreatedAt());
        dto.setUpdatedAt(pr.getUpdatedAt());
        dto.setPickupStartTime(pr.getFoodListing().getPickupStartTime());
        dto.setPickupEndTime(pr.getFoodListing().getPickupEndTime());
        return dto;
    }
}
