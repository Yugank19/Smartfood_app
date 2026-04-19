package com.myanatomy.sandboxpro.service;

import com.myanatomy.sandboxpro.model.FoodListing;
import com.myanatomy.sandboxpro.model.User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MatchingService {

    private static final double RADIUS_KM = 20.0; // 20 km radius filter

    /**
     * Finds AVAILABLE listings within 20km of the NGO/volunteer.
     * Uses Haversine formula for accurate distance calculation.
     * Falls back to all listings if NGO has no coordinates.
     */
    public List<FoodListing> findMatchingListingsForNGO(User ngo, List<FoodListing> allListings) {
        List<FoodListing> available = allListings.stream()
                .filter(l -> l.getStatus() == FoodListing.ListingStatus.AVAILABLE)
                .filter(l -> !l.getExpiryTime().isBefore(LocalDateTime.now()))
                .collect(Collectors.toList());

        // If NGO has coordinates, filter by 20km radius
        if (ngo.getLatitude() != null && ngo.getLongitude() != null) {
            List<FoodListing> withinRadius = available.stream()
                    .filter(l -> {
                        if (l.getLatitude() == null || l.getLongitude() == null) return true; // include unmapped
                        double dist = haversine(ngo.getLatitude(), ngo.getLongitude(),
                                l.getLatitude(), l.getLongitude());
                        return dist <= RADIUS_KM;
                    })
                    .collect(Collectors.toList());

            // Sort by distance first, then urgency
            return withinRadius.stream()
                    .sorted(Comparator
                            .comparingDouble((FoodListing l) -> {
                                if (l.getLatitude() == null) return Double.MAX_VALUE;
                                return haversine(ngo.getLatitude(), ngo.getLongitude(),
                                        l.getLatitude(), l.getLongitude());
                            })
                            .thenComparingLong(this::getUrgencyScore))
                    .collect(Collectors.toList());
        }

        // Fallback: no NGO coordinates — return all sorted by urgency
        return sortByUrgency(available);
    }

    /**
     * Finds listings within radius for a given lat/lng (used by controller with query params).
     */
    public List<FoodListing> findWithinRadius(double lat, double lng, double radiusKm,
                                               List<FoodListing> allListings) {
        return allListings.stream()
                .filter(l -> l.getStatus() == FoodListing.ListingStatus.AVAILABLE)
                .filter(l -> !l.getExpiryTime().isBefore(LocalDateTime.now()))
                .filter(l -> {
                    if (l.getLatitude() == null || l.getLongitude() == null) return false;
                    return haversine(lat, lng, l.getLatitude(), l.getLongitude()) <= radiusKm;
                })
                .sorted(Comparator
                        .comparingDouble((FoodListing l) ->
                                haversine(lat, lng, l.getLatitude(), l.getLongitude()))
                        .thenComparingLong(this::getUrgencyScore))
                .collect(Collectors.toList());
    }

    /**
     * Haversine formula — straight-line distance in km between two coordinates.
     */
    public double haversine(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    public List<FoodListing> sortByUrgency(List<FoodListing> listings) {
        return listings.stream()
                .sorted(Comparator.comparingLong(this::getUrgencyScore))
                .collect(Collectors.toList());
    }

    private long getUrgencyScore(FoodListing listing) {
        long minutesLeft = ChronoUnit.MINUTES.between(LocalDateTime.now(), listing.getExpiryTime());
        return Math.max(0, minutesLeft);
    }

    public List<FoodListing> getPriorityListings(List<FoodListing> listings) {
        return sortByUrgency(listings);
    }
}
