package com.myanatomy.sandboxpro.controller;

import com.myanatomy.sandboxpro.model.Rating;
import com.myanatomy.sandboxpro.repository.RatingRepository;
import com.myanatomy.sandboxpro.model.User;
import com.myanatomy.sandboxpro.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "*")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RatingRepository ratingRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Get current user's profile.
     */
    @GetMapping
    public ResponseEntity<User> getProfile() {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));
        System.out.println("[Profile] GET phone=" + phone + " lat=" + user.getLatitude() + " lng=" + user.getLongitude() + " address=" + user.getAddress());
        return ResponseEntity.ok(user);
    }

    /**
     * Full profile with ratings — used by the ProfilePage.
     * Returns user info + ratings received (as donor) + ratings given (as NGO).
     */
    @GetMapping("/me/full")
    public ResponseEntity<?> getFullProfile() {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Ratings received (donor was rated by NGOs)
        List<Rating> ratingsReceived = ratingRepository.findByDonorPhone(phone);
        // Ratings given (NGO rated donors)
        List<Rating> ratingsGiven = ratingRepository.findByNgoPhone(phone);

        Double avgScore = ratingRepository.getAverageScoreByDonorPhone(phone);

        List<Map<String, Object>> receivedList = ratingsReceived.stream().map(r -> {
            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("score", r.getScore());
            m.put("feedback", r.getFeedback() != null ? r.getFeedback() : "");
            m.put("reviewerName", r.getNgo() != null ? r.getNgo().getFullName() : "NGO");
            m.put("reviewerRole", "NGO");
            m.put("createdAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : "");
            return m;
        }).collect(Collectors.toList());

        List<Map<String, Object>> givenList = ratingsGiven.stream().map(r -> {
            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("score", r.getScore());
            m.put("feedback", r.getFeedback() != null ? r.getFeedback() : "");
            m.put("recipientName", r.getDonor() != null ? r.getDonor().getFullName() : "Donor");
            m.put("recipientRole", "DONOR");
            m.put("createdAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : "");
            return m;
        }).collect(Collectors.toList());

        int d = user.getTotalDeliveries() != null ? user.getTotalDeliveries() : 0;
        int c = user.getTotalCancellations() != null ? user.getTotalCancellations() : 0;
        double completionRate = (d + c) > 0 ? Math.round((double) d / (d + c) * 1000.0) / 10.0 : 100.0;

        // Use LinkedHashMap — Map.of() throws NullPointerException on null values
        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("id", user.getId());
        result.put("fullName", user.getFullName() != null ? user.getFullName() : "");
        result.put("phone", user.getPhone() != null ? user.getPhone() : "");
        result.put("role", user.getRole() != null ? user.getRole().name() : "");
        result.put("organizationName", user.getOrganizationName() != null ? user.getOrganizationName() : "");
        result.put("address", user.getAddress() != null ? user.getAddress() : "");
        result.put("organizationVerified", user.isOrganizationVerified());
        result.put("status", user.getStatus() != null ? user.getStatus().name() : "ACTIVE");
        result.put("trustScore", user.getTrustScore() != null ? user.getTrustScore() : 5.0);
        result.put("averageRating", avgScore != null ? Math.round(avgScore * 10.0) / 10.0 : 0.0);
        result.put("totalDeliveries", d);
        result.put("totalCancellations", c);
        result.put("totalRatings", ratingsReceived.size());
        result.put("completionRate", completionRate);
        result.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : "");
        result.put("ratingsReceived", receivedList);
        result.put("ratingsGiven", givenList);

        return ResponseEntity.ok(result);
    }

    /**
     * Update profile: address, organizationName, fullName.
     * Automatically geocodes the address to lat/lng using Nominatim.
     */
    @PatchMapping
    public ResponseEntity<User> updateProfile(@RequestBody Map<String, String> body) {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (body.containsKey("fullName") && !body.get("fullName").isBlank()) {
            user.setFullName(body.get("fullName"));
        }
        if (body.containsKey("organizationName")) {
            user.setOrganizationName(body.get("organizationName"));
        }
        if (body.containsKey("address") && !body.get("address").isBlank()) {
            String address = body.get("address");
            user.setAddress(address);
            // Geocode the address to lat/lng
            double[] coords = geocodeAddress(address);
            if (coords != null) {
                user.setLatitude(coords[0]);
                user.setLongitude(coords[1]);
            }
        }
        // Allow direct lat/lng override (from frontend geocoding)
        if (body.containsKey("latitude") && body.containsKey("longitude")) {
            String latStr = body.get("latitude");
            String lngStr = body.get("longitude");
            if (latStr != null && !latStr.isBlank() && !latStr.equals("null")
                    && lngStr != null && !lngStr.isBlank() && !lngStr.equals("null")) {
                try {
                    user.setLatitude(Double.parseDouble(latStr));
                    user.setLongitude(Double.parseDouble(lngStr));
                } catch (NumberFormatException ignored) {
                    System.err.println("[Profile] Invalid lat/lng: " + latStr + ", " + lngStr);
                }
            }
        }

        return ResponseEntity.ok(userRepository.save(user));
    }

    /**
     * Geocodes an address using OpenStreetMap Nominatim (free, no API key).
     * Returns [lat, lng] or null if geocoding fails.
     */
    private double[] geocodeAddress(String address) {
        try {
            String encoded = java.net.URLEncoder.encode(address, "UTF-8");
            String url = "https://nominatim.openstreetmap.org/search?q=" + encoded + "&format=json&limit=1";

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "MealBridge/1.0 (food-redistribution-platform)");
            headers.set("Accept-Language", "en");

            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
            org.springframework.http.ResponseEntity<java.util.List> response = restTemplate.exchange(
                url, org.springframework.http.HttpMethod.GET, entity, java.util.List.class
            );

            if (response.getBody() != null && !response.getBody().isEmpty()) {
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> result = (java.util.Map<String, Object>) response.getBody().get(0);
                double lat = Double.parseDouble(result.get("lat").toString());
                double lon = Double.parseDouble(result.get("lon").toString());
                System.out.println("Geocoded '" + address + "' → [" + lat + ", " + lon + "]");
                return new double[]{lat, lon};
            }
        } catch (Exception e) {
            System.err.println("Geocoding failed for '" + address + "': " + e.getMessage());
        }
        return null;
    }
}
