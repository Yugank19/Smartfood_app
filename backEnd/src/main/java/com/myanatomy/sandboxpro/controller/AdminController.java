package com.myanatomy.sandboxpro.controller;

import com.myanatomy.sandboxpro.dto.ActivityLogDTO;
import com.myanatomy.sandboxpro.dto.AdminAnalyticsDTO;
import com.myanatomy.sandboxpro.dto.PickupRequestDTO;
import com.myanatomy.sandboxpro.model.FoodListing;
import com.myanatomy.sandboxpro.model.PickupRequest;
import com.myanatomy.sandboxpro.model.User;
import com.myanatomy.sandboxpro.repository.FoodListingRepository;
import com.myanatomy.sandboxpro.repository.PickupRequestRepository;
import com.myanatomy.sandboxpro.repository.UserRepository;
import com.myanatomy.sandboxpro.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FoodListingRepository foodListingRepository;

    @Autowired
    private PickupRequestRepository pickupRequestRepository;

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<User> updateUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(User.Status.valueOf(body.get("status")));
        return ResponseEntity.ok(userRepository.save(user));
    }

    @GetMapping("/listings")
    public ResponseEntity<List<FoodListing>> getAllListings() {
        return ResponseEntity.ok(foodListingRepository.findAll());
    }

    @GetMapping("/pickups")
    public ResponseEntity<List<PickupRequestDTO>> getAllPickups() {
        List<PickupRequestDTO> pickups = pickupRequestRepository.findAll()
                .stream()
                .map(PickupRequestDTO::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(pickups);
    }

    @GetMapping("/analytics")
    public ResponseEntity<AdminAnalyticsDTO> getAnalytics() {
        return ResponseEntity.ok(analyticsService.getAdminAnalytics());
    }

    /**
     * Admin verifies a donor/NGO organization (PDF §4 - donor profile and verification).
     */
    @PatchMapping("/users/{id}/verify")
    public ResponseEntity<User> verifyOrganization(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setOrganizationVerified(true);
        user.setVerificationNotes(body.getOrDefault("notes", "Verified by admin"));
        user.setStatus(User.Status.ACTIVE);
        return ResponseEntity.ok(userRepository.save(user));
    }

    /**
     * Admin rejects/unverifies a donor organization.
     */
    @PatchMapping("/users/{id}/unverify")
    public ResponseEntity<User> unverifyOrganization(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setOrganizationVerified(false);
        user.setVerificationNotes(body.getOrDefault("notes", "Verification rejected by admin"));
        return ResponseEntity.ok(userRepository.save(user));
    }

    @GetMapping("/activity")
    public ResponseEntity<List<ActivityLogDTO>> getRecentActivity() {
        List<ActivityLogDTO> activity = new java.util.ArrayList<>();

        // Recent user registrations
        userRepository.findAll().stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .limit(5)
            .forEach(u -> activity.add(new ActivityLogDTO(
                u.getId(),
                "User @" + u.getFullName() + " registered as " + u.getRole().name(),
                "registration",
                u.getCreatedAt(),
                u.getFullName()
            )));

        // Recent food listings
        foodListingRepository.findAll().stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .limit(5)
            .forEach(fl -> activity.add(new ActivityLogDTO(
                fl.getId(),
                "Donor " + fl.getDonor().getFullName() + " listed " + fl.getFoodType() + " (" + fl.getQuantity() + ")",
                "listing",
                fl.getCreatedAt(),
                fl.getDonor().getFullName()
            )));

        // Recent pickups
        pickupRequestRepository.findAll().stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .limit(5)
            .forEach(pr -> activity.add(new ActivityLogDTO(
                pr.getId(),
                "NGO " + pr.getNgo().getFullName() + " claimed " + pr.getFoodListing().getFoodType() + " [" + pr.getStatus() + "]",
                pr.getStatus() == com.myanatomy.sandboxpro.model.PickupRequest.Status.DELIVERED ? "delivery" : "pickup",
                pr.getCreatedAt(),
                pr.getNgo().getFullName()
            )));

        // Sort all by timestamp desc, take top 15
        activity.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        return ResponseEntity.ok(activity.stream().limit(15).collect(java.util.stream.Collectors.toList()));
    }

    /**
     * Users pending verification (PENDING_VERIFICATION status).
     */
    @GetMapping("/pending-verifications")
    public ResponseEntity<List<User>> getPendingVerifications() {
        List<User> pending = userRepository.findAll().stream()
            .filter(u -> u.getStatus() == User.Status.PENDING_VERIFICATION)
            .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(pending);
    }
}
