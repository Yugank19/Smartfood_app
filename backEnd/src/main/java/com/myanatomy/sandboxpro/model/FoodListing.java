package com.myanatomy.sandboxpro.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;

@Entity
@Table(name = "food_listings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FoodListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "donor_id", nullable = false)
    @JsonIgnoreProperties({"pin", "hibernateLazyInitializer", "handler"})
    private User donor;

    @Column(nullable = false)
    private String foodType;

    @Column(nullable = false)
    private String quantity;

    @Column(nullable = false)
    private LocalDateTime preparationTime;

    @Column(nullable = false)
    private LocalDateTime expiryTime;

    // Feature 2: Pickup time slot
    private LocalDateTime pickupStartTime;
    private LocalDateTime pickupEndTime;

    @Column(nullable = false)
    private String location;

    private Double latitude;
    private Double longitude;

    // Feature 1: Image upload (Multiple supported)
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "food_listing_images", joinColumns = @JoinColumn(name = "listing_id"))
    @Column(name = "image_url")
    @com.fasterxml.jackson.annotation.JsonProperty("imageUrls")
    private java.util.List<String> imageUrls = new java.util.ArrayList<>();

    private boolean photoVerified = false;

    // Feature 7: Animal feed flow
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FoodCategory foodCategory = FoodCategory.EDIBLE;

    private String packagingDetails;

    // Feature 3: Proof images
    private String pickupProofImageUrl;
    private String deliveryProofImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ListingStatus status = ListingStatus.AVAILABLE;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum ListingStatus {
        AVAILABLE, ACCEPTED, PICKED_UP, DELIVERED, EXPIRED, CANCELLED
    }

    public enum FoodCategory {
        EDIBLE,       // Goes to NGOs
        NON_EDIBLE,   // Goes to Animal Care groups
        BAKERY,
        COOKED,
        RAW,
        BEVERAGES
    }
}
