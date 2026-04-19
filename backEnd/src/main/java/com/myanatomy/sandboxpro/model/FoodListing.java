package com.myanatomy.sandboxpro.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    @ManyToOne
    @JoinColumn(name = "donor_id", nullable = false)
    private User donor;

    @Column(nullable = false)
    private String foodType;

    @Column(nullable = false)
    private String quantity; // e.g., "10kg" or "50 meals"

    @Column(nullable = false)
    private LocalDateTime preparationTime;

    @Column(nullable = false)
    private LocalDateTime expiryTime;

    @Column(nullable = false)
    private String location;

    // Coordinates for map display (optional - geocoded from address)
    private Double latitude;
    private Double longitude;

    private String imageUrl;

    // Packaging and safety details (PDF requirement)
    private String packagingDetails;  // e.g., "Sealed containers", "Wrapped"
    private String foodCategory;      // e.g., "Cooked", "Raw", "Bakery", "Beverages"
    private boolean photoVerified = false;  // Admin/system marks photo as verified

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ListingStatus status = ListingStatus.AVAILABLE;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum ListingStatus {
        AVAILABLE, ACCEPTED, PICKED_UP, DELIVERED, EXPIRED, CANCELLED
    }
}
