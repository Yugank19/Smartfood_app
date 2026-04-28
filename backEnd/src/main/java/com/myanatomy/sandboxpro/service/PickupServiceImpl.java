package com.myanatomy.sandboxpro.service;

import com.myanatomy.sandboxpro.dto.PickupRequestDTO;
import com.myanatomy.sandboxpro.exception.ConflictException;
import com.myanatomy.sandboxpro.model.DeliveryLog;
import com.myanatomy.sandboxpro.model.FoodListing;
import com.myanatomy.sandboxpro.model.PickupRequest;
import com.myanatomy.sandboxpro.model.User;
import com.myanatomy.sandboxpro.repository.DeliveryLogRepository;
import com.myanatomy.sandboxpro.repository.FoodListingRepository;
import com.myanatomy.sandboxpro.repository.PickupRequestRepository;
import com.myanatomy.sandboxpro.repository.UserRepository;
import com.myanatomy.sandboxpro.service.NotificationService;
import com.myanatomy.sandboxpro.service.TrustScoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PickupServiceImpl implements PickupService {

    @Autowired
    private PickupRequestRepository pickupRequestRepository;

    @Autowired
    private DeliveryLogRepository deliveryLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FoodListingRepository foodListingRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private TrustScoreService trustScoreService;

    @Override
    public PickupRequest createPickupRequest(FoodListing listing, User ngo) {
        PickupRequest pickupRequest = new PickupRequest();
        pickupRequest.setFoodListing(listing);
        pickupRequest.setNgo(ngo);
        pickupRequest.setStatus(PickupRequest.Status.PENDING);
        return pickupRequestRepository.save(pickupRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PickupRequestDTO> getAvailablePickups() {
        return pickupRequestRepository.findByStatus(PickupRequest.Status.PENDING)
                .stream()
                .map(PickupRequestDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PickupRequest acceptPickup(Long pickupId, String volunteerPhone) {
        PickupRequest pickup = pickupRequestRepository.findById(pickupId)
                .orElseThrow(() -> new RuntimeException("Pickup request not found"));

        if (pickup.getStatus() != PickupRequest.Status.PENDING) {
            throw new ConflictException("Pickup request is no longer available");
        }

        User volunteer = userRepository.findByPhone(volunteerPhone)
                .orElseThrow(() -> new RuntimeException("Volunteer not found"));

        pickup.setVolunteer(volunteer);
        pickup.setStatus(PickupRequest.Status.ASSIGNED);
        PickupRequest saved = pickupRequestRepository.save(pickup);

        // Notify donor and NGO
        notificationService.notifyDonor(saved.getFoodListing().getDonor().getPhone(),
            Map.of("type", "VOLUNTEER_ASSIGNED", "volunteerName", volunteer.getFullName(), "pickupId", saved.getId()));
        notificationService.notifyNGO(saved.getNgo().getPhone(),
            Map.of("type", "VOLUNTEER_ASSIGNED", "volunteerName", volunteer.getFullName(), "pickupId", saved.getId()));
        notificationService.notifyPickupUpdate(Map.of("type", "ASSIGNED", "pickupId", saved.getId()));

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PickupRequestDTO> getMyAssignments(String volunteerPhone) {
        return pickupRequestRepository.findByVolunteerPhoneOrderByUpdatedAtDesc(volunteerPhone)
                .stream()
                .map(PickupRequestDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PickupRequest updatePickupStatus(Long pickupId, PickupRequest.Status newStatus, String volunteerPhone) {
        PickupRequest pickup = pickupRequestRepository.findById(pickupId)
                .orElseThrow(() -> new RuntimeException("Pickup request not found"));

        User volunteer = userRepository.findByPhone(volunteerPhone)
                .orElseThrow(() -> new RuntimeException("Volunteer not found"));

        if (pickup.getVolunteer() == null || !pickup.getVolunteer().getPhone().equals(volunteerPhone)) {
            throw new AccessDeniedException("You are not assigned to this pickup");
        }

        PickupRequest.Status current = pickup.getStatus();

        if (current == PickupRequest.Status.ASSIGNED && newStatus == PickupRequest.Status.PICKED_UP) {
            pickup.setStatus(PickupRequest.Status.PICKED_UP);
            FoodListing foodListing = pickup.getFoodListing();
            foodListing.setStatus(FoodListing.ListingStatus.PICKED_UP);
            foodListingRepository.save(foodListing);
        } else if (current == PickupRequest.Status.PICKED_UP && newStatus == PickupRequest.Status.DELIVERED) {
            pickup.setStatus(PickupRequest.Status.DELIVERED);
            FoodListing foodListing = pickup.getFoodListing();
            foodListing.setStatus(FoodListing.ListingStatus.DELIVERED);
            foodListingRepository.save(foodListing);

            // Update trust score for the donor on successful delivery
            User donor = foodListing.getDonor();
            if (donor != null) {
                trustScoreService.recordDelivery(donor);
            }
        } else {
            throw new IllegalArgumentException("Invalid transition: " + current + " → " + newStatus);
        }

        PickupRequest savedPickup = pickupRequestRepository.save(pickup);

        DeliveryLog log = new DeliveryLog();
        log.setPickupRequest(savedPickup);
        log.setPreviousStatus(current);
        log.setNewStatus(newStatus);
        log.setChangedBy(volunteer);
        log.setTimestamp(LocalDateTime.now());
        deliveryLogRepository.save(log);

        // Notify all parties of status change
        String notifType = newStatus == PickupRequest.Status.PICKED_UP ? "PICKED_UP" : "DELIVERED";
        notificationService.notifyDonor(savedPickup.getFoodListing().getDonor().getPhone(),
            Map.of("type", notifType, "pickupId", savedPickup.getId()));
        notificationService.notifyNGO(savedPickup.getNgo().getPhone(),
            Map.of("type", notifType, "pickupId", savedPickup.getId()));
        notificationService.notifyPickupUpdate(Map.of("type", notifType, "pickupId", savedPickup.getId()));

        return savedPickup;
    }
}
