package com.myanatomy.sandboxpro.service;

import com.myanatomy.sandboxpro.dto.AdminAnalyticsDTO;
import com.myanatomy.sandboxpro.dto.PublicAnalyticsDTO;
import com.myanatomy.sandboxpro.model.FoodListing;
import com.myanatomy.sandboxpro.model.PickupRequest;
import com.myanatomy.sandboxpro.model.User;
import com.myanatomy.sandboxpro.repository.FoodListingRepository;
import com.myanatomy.sandboxpro.repository.PickupRequestRepository;
import com.myanatomy.sandboxpro.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FoodListingRepository foodListingRepository;

    @Autowired
    private PickupRequestRepository pickupRequestRepository;

    public AdminAnalyticsDTO getAdminAnalytics() {
        long totalMealsSaved = foodListingRepository.countByStatus(FoodListing.ListingStatus.DELIVERED);
        long totalDeliveries = pickupRequestRepository.countByStatus(PickupRequest.Status.DELIVERED);
        long activeDonors = userRepository.countByRoleAndStatus(User.Role.DONOR, User.Status.ACTIVE);
        long activeNGOs = userRepository.countByRoleAndStatus(User.Role.NGO, User.Status.ACTIVE);
        long activeVolunteers = userRepository.countByRoleAndStatus(User.Role.VOLUNTEER, User.Status.ACTIVE);
        return new AdminAnalyticsDTO(totalMealsSaved, totalDeliveries, activeDonors, activeNGOs, activeVolunteers);
    }

    public PublicAnalyticsDTO getPublicAnalytics() {
        long totalMealsSaved = foodListingRepository.countByStatus(FoodListing.ListingStatus.DELIVERED);
        long activeDonors = userRepository.countByRoleAndStatus(User.Role.DONOR, User.Status.ACTIVE);
        return new PublicAnalyticsDTO(totalMealsSaved, activeDonors);
    }
}
