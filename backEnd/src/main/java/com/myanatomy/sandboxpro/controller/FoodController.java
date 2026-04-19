package com.myanatomy.sandboxpro.controller;

import com.myanatomy.sandboxpro.dto.DonorStatsDTO;
import com.myanatomy.sandboxpro.model.FoodListing;
import com.myanatomy.sandboxpro.model.User;
import com.myanatomy.sandboxpro.repository.FoodListingRepository;
import com.myanatomy.sandboxpro.repository.UserRepository;
import com.myanatomy.sandboxpro.service.FoodService;
import com.myanatomy.sandboxpro.service.MatchingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/food")
@CrossOrigin(origins = "*")
public class FoodController {

    @Autowired
    private FoodService foodService;

    @Autowired
    private FoodListingRepository foodListingRepository;

    @Autowired
    private MatchingService matchingService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/list")
    public ResponseEntity<FoodListing> createListing(@RequestBody FoodListing listing) {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(foodService.createListing(listing, phone));
    }

    @GetMapping("/available")
    public ResponseEntity<List<FoodListing>> getAvailableListings() {
        List<FoodListing> listings = foodService.getAvailableListings();
        // Enrich listings with donor coordinates if listing has none
        listings.forEach(l -> {
            if ((l.getLatitude() == null || l.getLongitude() == null)
                    && l.getDonor() != null
                    && l.getDonor().getLatitude() != null) {
                l.setLatitude(l.getDonor().getLatitude());
                l.setLongitude(l.getDonor().getLongitude());
            }
        });
        return ResponseEntity.ok(listings);
    }

    /**
     * Smart nearby feed for NGOs - uses matching engine to sort by urgency and proximity.
     * PDF §5: "Real-Time Nearby Food Feed: NGOs see live food posts based on location and urgency"
     */
    /**
     * Smart nearby feed — returns listings within 20km radius.
     * Accepts optional lat/lng query params from frontend for precise filtering.
     * Falls back to NGO's saved profile coordinates if no params provided.
     */
    @GetMapping("/nearby")
    public ResponseEntity<List<FoodListing>> getNearbyListings(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false, defaultValue = "20") double radius) {

        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        User ngo = userRepository.findByPhone(phone).orElse(null);
        List<FoodListing> allAvailable = foodService.getAvailableListings();

        // Enrich with donor coordinates
        allAvailable.forEach(l -> {
            if ((l.getLatitude() == null || l.getLongitude() == null)
                    && l.getDonor() != null && l.getDonor().getLatitude() != null) {
                l.setLatitude(l.getDonor().getLatitude());
                l.setLongitude(l.getDonor().getLongitude());
            }
        });

        // Use query params if provided (frontend sends current GPS location)
        if (lat != null && lng != null) {
            List<FoodListing> nearby = matchingService.findWithinRadius(lat, lng, radius, allAvailable);
            // Also include unmapped listings (no coordinates) so nothing is hidden
            List<FoodListing> unmapped = allAvailable.stream()
                    .filter(l -> l.getLatitude() == null || l.getLongitude() == null)
                    .collect(java.util.stream.Collectors.toList());
            nearby.addAll(unmapped);
            return ResponseEntity.ok(nearby);
        }

        // Use NGO's saved profile coordinates
        if (ngo != null) {
            return ResponseEntity.ok(matchingService.findMatchingListingsForNGO(ngo, allAvailable));
        }

        return ResponseEntity.ok(matchingService.sortByUrgency(allAvailable));
    }

    @PatchMapping("/{id}/claim")
    public ResponseEntity<FoodListing> claimListing(@PathVariable Long id) {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(foodService.claimListing(id, phone));
    }

    @GetMapping("/my-listings")
    public ResponseEntity<List<FoodListing>> getMyListings() {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(foodService.getMyListings(phone));
    }

    /**
     * Donor stats: meals shared, active listings, CO2 offset estimate.
     */
    @GetMapping("/my-stats")
    public ResponseEntity<DonorStatsDTO> getMyStats() {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        long mealsShared = foodListingRepository.countByDonorPhoneAndStatus(phone, FoodListing.ListingStatus.DELIVERED);
        long activeListings = foodListingRepository.countByDonorPhoneAndStatus(phone, FoodListing.ListingStatus.AVAILABLE);
        long totalListings = foodListingRepository.countByDonorPhone(phone);
        double co2 = Math.round(mealsShared * 0.0004 * 100.0) / 100.0;
        return ResponseEntity.ok(new DonorStatsDTO(mealsShared, activeListings, totalListings, co2));
    }

    /**
     * Donor cancels their own AVAILABLE listing.
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancelListing(@PathVariable Long id) {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        FoodListing listing = foodListingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        if (!listing.getDonor().getPhone().equals(phone)) {
            return ResponseEntity.status(403).body(java.util.Map.of("message", "Not your listing"));
        }
        if (listing.getStatus() != FoodListing.ListingStatus.AVAILABLE) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Only AVAILABLE listings can be cancelled"));
        }
        listing.setStatus(FoodListing.ListingStatus.CANCELLED);
        foodListingRepository.save(listing);
        return ResponseEntity.ok(java.util.Map.of("message", "Listing cancelled"));
    }
}
