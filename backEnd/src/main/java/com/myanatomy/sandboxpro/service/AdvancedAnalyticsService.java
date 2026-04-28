package com.myanatomy.sandboxpro.service;

import com.myanatomy.sandboxpro.model.FoodListing;
import com.myanatomy.sandboxpro.model.PickupRequest;
import com.myanatomy.sandboxpro.model.User;
import com.myanatomy.sandboxpro.repository.FoodListingRepository;
import com.myanatomy.sandboxpro.repository.PickupRequestRepository;
import com.myanatomy.sandboxpro.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Feature 5: Advanced Analytics Dashboard
 */
@Service
public class AdvancedAnalyticsService {

    @Autowired private FoodListingRepository foodListingRepository;
    @Autowired private PickupRequestRepository pickupRequestRepository;
    @Autowired private UserRepository userRepository;

    public Map<String, Object> getFullAnalytics() {
        Map<String, Object> analytics = new LinkedHashMap<>();

        List<FoodListing> allListings = foodListingRepository.findAll();
        List<PickupRequest> allPickups = pickupRequestRepository.findAll();

        long total = allListings.size();
        long delivered = allListings.stream().filter(l -> l.getStatus() == FoodListing.ListingStatus.DELIVERED).count();
        long expired = allListings.stream().filter(l -> l.getStatus() == FoodListing.ListingStatus.EXPIRED).count();
        long cancelled = allListings.stream().filter(l -> l.getStatus() == FoodListing.ListingStatus.CANCELLED).count();

        // Pickup success rate
        double successRate = total > 0 ? Math.round((double) delivered / total * 1000.0) / 10.0 : 0;
        double expiryRate = total > 0 ? Math.round((double) expired / total * 1000.0) / 10.0 : 0;

        analytics.put("totalListings", total);
        analytics.put("deliveredListings", delivered);
        analytics.put("expiredListings", expired);
        analytics.put("cancelledListings", cancelled);
        analytics.put("pickupSuccessRate", successRate);
        analytics.put("expiryRate", expiryRate);

        // Average response time (listing created → first pickup request)
        double avgResponseMinutes = allPickups.stream()
                .mapToLong(pr -> ChronoUnit.MINUTES.between(
                        pr.getFoodListing().getCreatedAt(), pr.getCreatedAt()))
                .filter(m -> m >= 0 && m < 1440) // filter outliers > 24h
                .average().orElse(0);
        analytics.put("avgResponseTimeMinutes", Math.round(avgResponseMinutes));

        // Top 5 donors by deliveries
        Map<String, Long> donorDeliveries = allListings.stream()
                .filter(l -> l.getStatus() == FoodListing.ListingStatus.DELIVERED)
                .collect(Collectors.groupingBy(
                        l -> l.getDonor().getFullName() + " (" + l.getDonor().getOrganizationName() + ")",
                        Collectors.counting()));
        analytics.put("topDonors", donorDeliveries.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> Map.of("name", e.getKey(), "deliveries", e.getValue()))
                .collect(Collectors.toList()));

        // Top 5 NGOs by claims
        Map<String, Long> ngoActivity = allPickups.stream()
                .collect(Collectors.groupingBy(
                        pr -> pr.getNgo().getFullName(),
                        Collectors.counting()));
        analytics.put("topNGOs", ngoActivity.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> Map.of("name", e.getKey(), "claims", e.getValue()))
                .collect(Collectors.toList()));

        // Listings by food category
        Map<String, Long> byCategory = allListings.stream()
                .collect(Collectors.groupingBy(
                        l -> l.getFoodCategory() != null ? l.getFoodCategory().name() : "EDIBLE",
                        Collectors.counting()));
        analytics.put("listingsByCategory", byCategory);

        // Listings per day (last 7 days)
        List<Map<String, Object>> dailyTrend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime day = LocalDateTime.now().minusDays(i).withHour(0).withMinute(0);
            LocalDateTime nextDay = day.plusDays(1);
            long count = allListings.stream()
                    .filter(l -> l.getCreatedAt().isAfter(day) && l.getCreatedAt().isBefore(nextDay))
                    .count();
            dailyTrend.add(Map.of("date", day.toLocalDate().toString(), "listings", count));
        }
        analytics.put("dailyTrend", dailyTrend);

        // User counts
        analytics.put("totalDonors", userRepository.countByRoleAndStatus(User.Role.DONOR, User.Status.ACTIVE));
        analytics.put("totalNGOs", userRepository.countByRoleAndStatus(User.Role.NGO, User.Status.ACTIVE));
        analytics.put("totalVolunteers", userRepository.countByRoleAndStatus(User.Role.VOLUNTEER, User.Status.ACTIVE));
        analytics.put("totalAnimalCare", userRepository.countByRoleAndStatus(User.Role.ANIMAL_CARE, User.Status.ACTIVE));

        return analytics;
    }
}
