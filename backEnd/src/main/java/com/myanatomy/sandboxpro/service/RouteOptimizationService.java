package com.myanatomy.sandboxpro.service;

import com.myanatomy.sandboxpro.model.FoodListing;
import com.myanatomy.sandboxpro.model.PickupRequest;
import com.myanatomy.sandboxpro.repository.PickupRequestRepository;
import com.myanatomy.sandboxpro.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Feature 8: Route Optimization (Multi-Pickup)
 *
 * Groups nearby PENDING pickups and generates an optimized route
 * using a greedy Nearest Neighbor TSP approximation.
 * Uses Haversine distance (no external API needed).
 */
@Service
public class RouteOptimizationService {

    @Autowired private PickupRequestRepository pickupRequestRepository;
    @Autowired private UserRepository userRepository;

    private static final double GROUPING_RADIUS_KM = 5.0; // group pickups within 5km

    /**
     * Returns an optimized ordered list of pickup requests for a volunteer.
     * Groups nearby pickups and sorts by nearest-neighbor algorithm.
     *
     * @param volunteerPhone volunteer's phone
     * @param startLat volunteer's current latitude
     * @param startLng volunteer's current longitude
     */
    public List<Map<String, Object>> getOptimizedRoute(String volunteerPhone, double startLat, double startLng) {
        // Get all PENDING pickups
        List<PickupRequest> pending = pickupRequestRepository.findByStatus(PickupRequest.Status.PENDING);

        // Filter those with coordinates within grouping radius
        List<PickupRequest> nearby = pending.stream()
                .filter(pr -> {
                    FoodListing fl = pr.getFoodListing();
                    if (fl.getLatitude() == null || fl.getLongitude() == null) return false;
                    return haversine(startLat, startLng, fl.getLatitude(), fl.getLongitude()) <= GROUPING_RADIUS_KM * 4;
                })
                .collect(Collectors.toList());

        if (nearby.isEmpty()) {
            return Collections.emptyList();
        }

        // Nearest Neighbor TSP: start from volunteer, always go to nearest unvisited
        List<PickupRequest> optimized = new ArrayList<>();
        List<PickupRequest> remaining = new ArrayList<>(nearby);
        double curLat = startLat, curLng = startLng;

        while (!remaining.isEmpty()) {
            PickupRequest nearest = remaining.stream()
                    .min(Comparator.comparingDouble(pr ->
                            haversine(curLat, curLng,
                                    pr.getFoodListing().getLatitude(),
                                    pr.getFoodListing().getLongitude())))
                    .orElseThrow();
            optimized.add(nearest);
            remaining.remove(nearest);
        }

        // Build response with distance from previous stop
        List<Map<String, Object>> result = new ArrayList<>();
        double prevLat = startLat, prevLng = startLng;
        double totalDistance = 0;

        for (int i = 0; i < optimized.size(); i++) {
            PickupRequest pr = optimized.get(i);
            FoodListing fl = pr.getFoodListing();
            double dist = haversine(prevLat, prevLng, fl.getLatitude(), fl.getLongitude());
            totalDistance += dist;

            Map<String, Object> stop = new LinkedHashMap<>();
            stop.put("stopNumber", i + 1);
            stop.put("pickupId", pr.getId());
            stop.put("foodType", fl.getFoodType());
            stop.put("quantity", fl.getQuantity());
            stop.put("location", fl.getLocation());
            stop.put("latitude", fl.getLatitude());
            stop.put("longitude", fl.getLongitude());
            stop.put("donorName", fl.getDonor().getFullName());
            stop.put("ngoName", pr.getNgo().getFullName());
            stop.put("distanceFromPrevKm", Math.round(dist * 10.0) / 10.0);
            stop.put("estimatedMinutes", (int) Math.ceil(dist / 30 * 60));
            result.add(stop);

            prevLat = fl.getLatitude();
            prevLng = fl.getLongitude();
        }

        // Add summary
        if (!result.isEmpty()) {
            result.get(0).put("totalStops", optimized.size());
            result.get(0).put("totalDistanceKm", Math.round(totalDistance * 10.0) / 10.0);
            result.get(0).put("totalEstimatedMinutes", (int) Math.ceil(totalDistance / 30 * 60));
        }

        return result;
    }

    private double haversine(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
