package com.myanatomy.sandboxpro.controller;

import com.myanatomy.sandboxpro.dto.RatingRequest;
import com.myanatomy.sandboxpro.model.Rating;
import com.myanatomy.sandboxpro.model.PickupRequest;
import com.myanatomy.sandboxpro.model.User;
import com.myanatomy.sandboxpro.repository.PickupRequestRepository;
import com.myanatomy.sandboxpro.repository.RatingRepository;
import com.myanatomy.sandboxpro.repository.UserRepository;
import com.myanatomy.sandboxpro.service.TrustScoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ratings")
@CrossOrigin(origins = "*")
public class RatingController {

    @Autowired private RatingRepository ratingRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PickupRequestRepository pickupRequestRepository;
    @Autowired private TrustScoreService trustScoreService; // F6

    /**
     * NGO submits a rating for a donor after delivery.
     * F6: Also triggers trust score recalculation.
     */
    @PostMapping
    public ResponseEntity<?> submitRating(@RequestBody RatingRequest request) {
        String ngoPhone = SecurityContextHolder.getContext().getAuthentication().getName();

        if (request.getScore() < 1 || request.getScore() > 5) {
            return ResponseEntity.badRequest().body(Map.of("message", "Score must be between 1 and 5"));
        }

        User ngo = userRepository.findByPhone(ngoPhone)
                .orElseThrow(() -> new RuntimeException("NGO not found"));
        User donor = userRepository.findByPhone(request.getDonorPhone())
                .orElseThrow(() -> new RuntimeException("Donor not found"));

        Rating rating = new Rating();
        rating.setNgo(ngo);
        rating.setDonor(donor);
        rating.setScore(request.getScore());
        rating.setFeedback(request.getFeedback());

        if (request.getPickupRequestId() != null) {
            pickupRequestRepository.findById(request.getPickupRequestId())
                    .ifPresent(rating::setPickupRequest);
        }

        ratingRepository.save(rating);

        // F6: Update donor's totalRatings and recalculate trust score
        donor.setTotalRatings((donor.getTotalRatings() != null ? donor.getTotalRatings() : 0) + 1);
        trustScoreService.recalculate(donor);

        return ResponseEntity.ok(Map.of(
            "message", "Rating submitted successfully",
            "score", request.getScore(),
            "donorTrustScore", donor.getTrustScore()
        ));
    }

    /**
     * Get trust score and rating info for a donor.
     * F6: Returns composite trust score breakdown.
     */
    @GetMapping("/donor/{phone}")
    public ResponseEntity<?> getDonorRating(@PathVariable String phone) {
        Double avg = ratingRepository.getAverageScoreByDonorPhone(phone);
        List<Rating> ratings = ratingRepository.findByDonorPhone(phone);
        User donor = userRepository.findByPhone(phone).orElse(null);

        return ResponseEntity.ok(Map.of(
            "averageScore",    avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0,
            "totalRatings",    ratings.size(),
            "trustScore",      donor != null && donor.getTrustScore() != null ? donor.getTrustScore() : 5.0,
            "totalDeliveries", donor != null && donor.getTotalDeliveries() != null ? donor.getTotalDeliveries() : 0,
            "completionRate",  computeCompletionRate(donor)
        ));
    }

    private double computeCompletionRate(User user) {
        if (user == null) return 1.0;
        int d = user.getTotalDeliveries()    != null ? user.getTotalDeliveries()    : 0;
        int c = user.getTotalCancellations() != null ? user.getTotalCancellations() : 0;
        int total = d + c;
        return total > 0 ? Math.round((double) d / total * 1000.0) / 10.0 : 100.0;
    }
}
