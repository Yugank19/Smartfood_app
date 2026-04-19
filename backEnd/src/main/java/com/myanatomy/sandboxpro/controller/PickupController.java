package com.myanatomy.sandboxpro.controller;

import com.myanatomy.sandboxpro.dto.PickupRequestDTO;
import com.myanatomy.sandboxpro.dto.UpdateStatusRequest;
import com.myanatomy.sandboxpro.model.PickupRequest;
import com.myanatomy.sandboxpro.repository.PickupRequestRepository;
import com.myanatomy.sandboxpro.service.NotificationService;
import com.myanatomy.sandboxpro.service.PickupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pickups")
@CrossOrigin(origins = "*")
public class PickupController {

    @Autowired
    private PickupService pickupService;

    @Autowired
    private PickupRequestRepository pickupRequestRepository;

    @Autowired
    private NotificationService notificationService;

    // ── VOLUNTEER endpoints ──────────────────────────────────────────────────

    @GetMapping("/available")
    public ResponseEntity<List<PickupRequestDTO>> getAvailablePickups() {
        return ResponseEntity.ok(pickupService.getAvailablePickups());
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<PickupRequestDTO> acceptPickup(@PathVariable Long id) {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        PickupRequest pickup = pickupService.acceptPickup(id, phone);
        return ResponseEntity.ok(PickupRequestDTO.from(pickup));
    }

    @GetMapping("/my-assignments")
    public ResponseEntity<List<PickupRequestDTO>> getMyAssignments() {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(pickupService.getMyAssignments(phone));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PickupRequestDTO> updatePickupStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request) {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        PickupRequest pickup = pickupService.updatePickupStatus(id, request.getStatus(), phone);
        return ResponseEntity.ok(PickupRequestDTO.from(pickup));
    }

    // ── NGO endpoints ────────────────────────────────────────────────────────

    /**
     * Returns all pickup requests for the logged-in NGO (active ones first).
     */
    @GetMapping("/my-requests")
    public ResponseEntity<List<PickupRequestDTO>> getMyRequests() {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        List<PickupRequestDTO> requests = pickupRequestRepository.findByNgoPhone(phone)
                .stream()
                .map(PickupRequestDTO::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(requests);
    }

    /**
     * Returns only active (non-delivered) pickup requests for the logged-in NGO.
     */
    @GetMapping("/my-active-requests")
    public ResponseEntity<List<PickupRequestDTO>> getMyActiveRequests() {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        List<PickupRequestDTO> requests = pickupRequestRepository.findActiveByNgoPhone(phone)
                .stream()
                .map(PickupRequestDTO::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(requests);
    }

    /**
     * Donor confirms food was delivered/received.
     * This is the final confirmation from the donor's side.
     * Marks the pickup as DELIVERED and the food listing as DELIVERED.
     * Notifies NGO and volunteer.
     */
    @PatchMapping("/{id}/donor-confirm-delivery")
    public ResponseEntity<?> donorConfirmDelivery(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        PickupRequest pickup = pickupRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pickup request not found"));

        // Verify this donor owns the food listing
        if (!pickup.getFoodListing().getDonor().getPhone().equals(phone)) {
            return ResponseEntity.status(403).body(java.util.Map.of("message", "Not your listing"));
        }

        // Allow confirmation from ASSIGNED or PICKED_UP state
        if (pickup.getStatus() == PickupRequest.Status.DELIVERED) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Already marked as delivered"));
        }
        if (pickup.getStatus() == PickupRequest.Status.PENDING) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Food has not been picked up yet"));
        }

        PickupRequest.Status previousStatus = pickup.getStatus();

        // Mark delivered
        pickup.setStatus(PickupRequest.Status.DELIVERED);
        com.myanatomy.sandboxpro.model.FoodListing listing = pickup.getFoodListing();
        listing.setStatus(com.myanatomy.sandboxpro.model.FoodListing.ListingStatus.DELIVERED);

        pickupRequestRepository.save(pickup);

        // Save delivery log
        com.myanatomy.sandboxpro.model.DeliveryLog log = new com.myanatomy.sandboxpro.model.DeliveryLog();
        log.setPickupRequest(pickup);
        log.setPreviousStatus(previousStatus);
        log.setNewStatus(PickupRequest.Status.DELIVERED);
        // changedBy = donor (load donor user)
        com.myanatomy.sandboxpro.model.User donor = pickup.getFoodListing().getDonor();
        log.setChangedBy(donor);
        log.setTimestamp(java.time.LocalDateTime.now());

        // Add delivery note if provided
        String note = body != null ? body.getOrDefault("note", "") : "";

        // Notify NGO and volunteer
        java.util.Map<String, Object> notif = java.util.Map.of(
            "type", "DELIVERED",
            "pickupId", pickup.getId(),
            "foodType", listing.getFoodType(),
            "donorName", donor.getFullName(),
            "note", note
        );
        notificationService.notifyNGO(pickup.getNgo().getPhone(), notif);
        if (pickup.getVolunteer() != null) {
            notificationService.notifyVolunteer(pickup.getVolunteer().getPhone(), notif);
        }
        notificationService.notifyPickupUpdate(notif);

        return ResponseEntity.ok(java.util.Map.of(
            "message", "Delivery confirmed! Thank you for your contribution.",
            "pickupId", pickup.getId()
        ));
    }

    /**
     * Get all active pickups for the logged-in donor
     * (food that has been claimed and is in progress).
     */
    @GetMapping("/donor-active")
    public ResponseEntity<List<PickupRequestDTO>> getDonorActivePickups() {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        List<PickupRequestDTO> active = pickupRequestRepository.findAll().stream()
                .filter(pr -> pr.getFoodListing().getDonor().getPhone().equals(phone))
                .filter(pr -> pr.getStatus() != PickupRequest.Status.DELIVERED)
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(PickupRequestDTO::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(active);
    }

    /**
     * Get all completed deliveries for the logged-in donor.
     */
    @GetMapping("/donor-history")
    public ResponseEntity<List<PickupRequestDTO>> getDonorHistory() {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        List<PickupRequestDTO> history = pickupRequestRepository.findAll().stream()
                .filter(pr -> pr.getFoodListing().getDonor().getPhone().equals(phone))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(PickupRequestDTO::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(history);
    }

    /**
     * NGO rejects a PENDING pickup request.
     * This cancels the pickup request and marks the food listing back to AVAILABLE.
     */
    @PatchMapping("/{id}/reject")
    public ResponseEntity<?> rejectPickup(@PathVariable Long id) {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        PickupRequest pickup = pickupRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pickup request not found"));

        if (!pickup.getNgo().getPhone().equals(phone)) {
            return ResponseEntity.status(403).body(java.util.Map.of("message", "Not your request"));
        }
        if (pickup.getStatus() != PickupRequest.Status.PENDING) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Only PENDING requests can be rejected"));
        }

        // Revert food listing to AVAILABLE so other NGOs can claim it
        com.myanatomy.sandboxpro.model.FoodListing listing = pickup.getFoodListing();
        listing.setStatus(com.myanatomy.sandboxpro.model.FoodListing.ListingStatus.AVAILABLE);
        pickupRequestRepository.delete(pickup);

        return ResponseEntity.ok(java.util.Map.of("message", "Request rejected. Listing is now available again."));
    }
}
