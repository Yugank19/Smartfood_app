package com.myanatomy.sandboxpro.controller;

import com.myanatomy.sandboxpro.model.FoodListing;
import com.myanatomy.sandboxpro.model.PickupRequest;
import com.myanatomy.sandboxpro.repository.FoodListingRepository;
import com.myanatomy.sandboxpro.repository.PickupRequestRepository;
import com.myanatomy.sandboxpro.service.ImageUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Feature 1: Food Image Upload
 * Feature 3: Proof of Pickup & Delivery
 */
@RestController
@RequestMapping("/api/images")
@CrossOrigin(origins = "*")
public class ImageController {

    @Autowired private ImageUploadService imageUploadService;
    @Autowired private FoodListingRepository foodListingRepository;
    @Autowired private PickupRequestRepository pickupRequestRepository;
    @Autowired private com.myanatomy.sandboxpro.service.NotificationService notificationService;

    /**
     * Feature 1: Upload food listing image.
     * Donor uploads image when creating/editing a listing.
     */
    @PostMapping("/food-listing/{listingId}")
    public ResponseEntity<?> uploadFoodImage(
            @PathVariable Long listingId,
            @RequestParam("image") MultipartFile image) {
        try {
            String phone = SecurityContextHolder.getContext().getAuthentication().getName();
            FoodListing listing = foodListingRepository.findById(listingId)
                    .orElseThrow(() -> new RuntimeException("Listing not found"));

            if (!listing.getDonor().getPhone().equals(phone)) {
                return ResponseEntity.status(403).body(Map.of("message", "Not your listing"));
            }

            String url = imageUploadService.uploadImage(image, "food-listings");
            listing.getImageUrls().add(url);
            foodListingRepository.save(listing);

            return ResponseEntity.ok(Map.of("imageUrl", url, "imageUrls", listing.getImageUrls(), "message", "Image uploaded successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Upload failed: " + e.getMessage()));
        }
    }

    /**
     * Upload multiple food listing images.
     */
    @PostMapping("/food-listing/{listingId}/multiple")
    public ResponseEntity<?> uploadMultipleFoodImages(
            @PathVariable Long listingId,
            @RequestParam("images") MultipartFile[] images) {
        try {
            String phone = SecurityContextHolder.getContext().getAuthentication().getName();
            FoodListing listing = foodListingRepository.findById(listingId)
                    .orElseThrow(() -> new RuntimeException("Listing not found"));

            if (!listing.getDonor().getPhone().equals(phone)) {
                return ResponseEntity.status(403).body(Map.of("message", "Not your listing"));
            }

            java.util.List<String> uploadedUrls = new java.util.ArrayList<>();
            for (MultipartFile file : images) {
                String url = imageUploadService.uploadImage(file, "food-listings");
                uploadedUrls.add(url);
                listing.getImageUrls().add(url);
            }
            foodListingRepository.save(listing);
            
            // Notify NGOs that images are now available (IMAGES_UPDATED event)
            notificationService.notifyNewListing(java.util.Map.of(
                "type", "IMAGES_UPDATED",
                "listingId", listing.getId(),
                "imageUrls", listing.getImageUrls()
            ));

            return ResponseEntity.ok(Map.of("imageUrls", listing.getImageUrls(), "message", "Images uploaded successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Upload failed: " + e.getMessage()));
        }
    }

    /**
     * Feature 3: Upload pickup proof image.
     * Volunteer uploads image when confirming pickup.
     */
    @PostMapping("/pickup-proof/{pickupId}")
    public ResponseEntity<?> uploadPickupProof(
            @PathVariable Long pickupId,
            @RequestParam("image") MultipartFile image) {
        try {
            String phone = SecurityContextHolder.getContext().getAuthentication().getName();
            PickupRequest pickup = pickupRequestRepository.findById(pickupId)
                    .orElseThrow(() -> new RuntimeException("Pickup not found"));

            if (pickup.getVolunteer() == null || !pickup.getVolunteer().getPhone().equals(phone)) {
                return ResponseEntity.status(403).body(Map.of("message", "Not your assignment"));
            }

            String url = imageUploadService.uploadImage(image, "pickup-proofs");
            pickup.setPickupProofImageUrl(url);
            pickup.setStatus(PickupRequest.Status.PICKED_UP);
            pickup.getFoodListing().setStatus(FoodListing.ListingStatus.PICKED_UP);
            foodListingRepository.save(pickup.getFoodListing());
            pickupRequestRepository.save(pickup);

            return ResponseEntity.ok(Map.of("imageUrl", url, "status", "PICKED_UP"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Feature 3: Upload delivery proof image.
     * Volunteer uploads image when confirming delivery.
     */
    @PostMapping("/delivery-proof/{pickupId}")
    public ResponseEntity<?> uploadDeliveryProof(
            @PathVariable Long pickupId,
            @RequestParam("image") MultipartFile image) {
        try {
            String phone = SecurityContextHolder.getContext().getAuthentication().getName();
            PickupRequest pickup = pickupRequestRepository.findById(pickupId)
                    .orElseThrow(() -> new RuntimeException("Pickup not found"));

            if (pickup.getVolunteer() == null || !pickup.getVolunteer().getPhone().equals(phone)) {
                return ResponseEntity.status(403).body(Map.of("message", "Not your assignment"));
            }

            String url = imageUploadService.uploadImage(image, "delivery-proofs");
            pickup.setDeliveryProofImageUrl(url);
            pickup.setStatus(PickupRequest.Status.DELIVERED);
            pickup.getFoodListing().setStatus(FoodListing.ListingStatus.DELIVERED);
            foodListingRepository.save(pickup.getFoodListing());
            pickupRequestRepository.save(pickup);

            return ResponseEntity.ok(Map.of("imageUrl", url, "status", "DELIVERED"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
