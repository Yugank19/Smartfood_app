package com.myanatomy.sandboxpro.controller;

import com.myanatomy.sandboxpro.model.User;
import com.myanatomy.sandboxpro.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "*")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Get current user's profile.
     */
    @GetMapping
    public ResponseEntity<User> getProfile() {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(user);
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
            try {
                user.setLatitude(Double.parseDouble(body.get("latitude")));
                user.setLongitude(Double.parseDouble(body.get("longitude")));
            } catch (NumberFormatException ignored) {}
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
            headers.set("User-Agent", "HarvestLink/1.0 (food-redistribution-platform)");
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
