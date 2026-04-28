package com.myanatomy.sandboxpro.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.myanatomy.sandboxpro.model.FoodListing;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO for creating a new food listing.
 * Avoids Jackson trying to deserialize the donor relationship from the request body.
 */
@Data
public class CreateListingRequest {
    private String foodType;
    private String quantity;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime preparationTime;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime expiryTime;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime pickupStartTime;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime pickupEndTime;

    private String location;
    private Double latitude;
    private Double longitude;
    private java.util.List<String> imageUrls;
    private String packagingDetails;
    private FoodListing.FoodCategory foodCategory;

    public FoodListing toEntity() {
        FoodListing listing = new FoodListing();
        listing.setFoodType(foodType);
        listing.setQuantity(quantity);
        listing.setPreparationTime(preparationTime);
        listing.setExpiryTime(expiryTime);
        listing.setPickupStartTime(pickupStartTime);
        listing.setPickupEndTime(pickupEndTime);
        listing.setLocation(location);
        listing.setLatitude(latitude);
        listing.setLongitude(longitude);
        if (imageUrls != null) {
            listing.setImageUrls(imageUrls);
        }
        listing.setPackagingDetails(packagingDetails);
        listing.setFoodCategory(foodCategory != null ? foodCategory : FoodListing.FoodCategory.EDIBLE);
        return listing;
    }
}
