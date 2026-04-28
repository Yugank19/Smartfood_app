package com.myanatomy.sandboxpro.service;

import com.myanatomy.sandboxpro.exception.ConflictException;
import com.myanatomy.sandboxpro.model.FoodListing;
import com.myanatomy.sandboxpro.model.User;
import com.myanatomy.sandboxpro.repository.FoodListingRepository;
import com.myanatomy.sandboxpro.repository.PickupRequestRepository;
import com.myanatomy.sandboxpro.repository.UserRepository;
import com.myanatomy.sandboxpro.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.myanatomy.sandboxpro.service.ChatService;

@Service
public class FoodService {

    @Autowired
    private FoodListingRepository foodListingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PickupService pickupService;

    @Autowired
    private PickupRequestRepository pickupRequestRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ChatService chatService;

    @Transactional
    public FoodListing createListing(FoodListing listing, String donorPhone) {
        User donor = userRepository.findByPhone(donorPhone)
                .orElseThrow(() -> new RuntimeException("Donor not found"));

        // Safety validation
        LocalDateTime now = LocalDateTime.now();

        if (listing.getExpiryTime() == null || listing.getPreparationTime() == null) {
            throw new IllegalArgumentException("preparationTime and expiryTime are required");
        }
        if (!listing.getExpiryTime().isAfter(listing.getPreparationTime())) {
            throw new IllegalArgumentException("expiryTime must be after preparationTime");
        }
        if (!listing.getExpiryTime().isAfter(now)) {
            throw new IllegalArgumentException("expiryTime must be in the future");
        }
        if (listing.getPreparationTime().isBefore(now.minusHours(24))) {
            throw new IllegalArgumentException("preparationTime cannot be more than 24 hours in the past");
        }

        // Feature 2: Validate pickup time slot if provided
        if (listing.getPickupStartTime() != null && listing.getPickupEndTime() != null) {
            if (!listing.getPickupEndTime().isAfter(listing.getPickupStartTime())) {
                throw new IllegalArgumentException("pickupEndTime must be after pickupStartTime");
            }
            if (listing.getPickupEndTime().isBefore(now)) {
                throw new IllegalArgumentException("pickupEndTime must be in the future");
            }
        }

        listing.setDonor(donor);
        listing.setStatus(FoodListing.ListingStatus.AVAILABLE);

        // Default foodCategory to EDIBLE if not provided
        if (listing.getFoodCategory() == null) {
            listing.setFoodCategory(FoodListing.FoodCategory.EDIBLE);
        }

        // Auto-inherit donor's coordinates if listing has no coordinates
        if ((listing.getLatitude() == null || listing.getLongitude() == null)
                && donor.getLatitude() != null && donor.getLongitude() != null) {
            listing.setLatitude(donor.getLatitude());
            listing.setLongitude(donor.getLongitude());
        }

        // If listing has a location string but no coords, use donor address coords as fallback
        if (listing.getLatitude() == null && donor.getAddress() != null) {
            listing.setLatitude(donor.getLatitude());
            listing.setLongitude(donor.getLongitude());
        }

        FoodListing saved = foodListingRepository.save(listing);

        // Notify all NGOs of new listing via WebSocket
        notificationService.notifyNewListing(Map.of(
            "type", "NEW_LISTING",
            "id", saved.getId(),
            "foodType", saved.getFoodType(),
            "quantity", saved.getQuantity(),
            "location", saved.getLocation(),
            "donorName", donor.getFullName()
        ));

        return saved;
    }

    public List<FoodListing> getAvailableListings() {
        return foodListingRepository.findByStatus(FoodListing.ListingStatus.AVAILABLE);
    }

    public List<FoodListing> getMyListings(String donorPhone) {
        return foodListingRepository.findByDonorPhoneOrderByCreatedAtDesc(donorPhone);
    }

    @Transactional
    public FoodListing claimListing(Long listingId, String ngoPhone) {
        FoodListing listing = foodListingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        if (listing.getStatus() != FoodListing.ListingStatus.AVAILABLE) {
            throw new ConflictException("Food listing is no longer available");
        }

        // Feature 2: Reject claim if pickup window has expired
        if (listing.getPickupEndTime() != null && listing.getPickupEndTime().isBefore(java.time.LocalDateTime.now())) {
            throw new ConflictException("Pickup time slot has expired for this listing");
        }

        User ngo = userRepository.findByPhone(ngoPhone)
                .orElseThrow(() -> new RuntimeException("NGO user not found"));

        listing.setStatus(FoodListing.ListingStatus.ACCEPTED);
        FoodListing saved = foodListingRepository.save(listing);

        // Create pickup request
        com.myanatomy.sandboxpro.model.PickupRequest pickupRequest = pickupService.createPickupRequest(saved, ngo);

        // Feature 4: Create chat room and persist chatRoomId back on the pickup request
        com.myanatomy.sandboxpro.model.ChatRoom chatRoom = chatService.createChatRoom(pickupRequest);
        if (chatRoom != null) {
            pickupRequest.setChatRoomId(chatRoom.getId());
            pickupRequestRepository.save(pickupRequest);
        }

        // Notify donor that their food has been claimed
        notificationService.notifyDonor(saved.getDonor().getPhone(), Map.of(
            "type", "LISTING_CLAIMED",
            "listingId", saved.getId(),
            "ngoName", ngo.getFullName(),
            "message", "Your food donation has been claimed by " + ngo.getFullName()
        ));

        return saved;
    }

    /**
     * Runs every 15 minutes to expire stale AVAILABLE listings.
     */
    @Scheduled(fixedRate = 900_000)
    @Transactional
    public void expireStaleListings() {
        List<FoodListing> stale = foodListingRepository.findExpiredAvailableListings(LocalDateTime.now());
        for (FoodListing listing : stale) {
            listing.setStatus(FoodListing.ListingStatus.EXPIRED);
        }
        if (!stale.isEmpty()) {
            foodListingRepository.saveAll(stale);
        }
    }
}
