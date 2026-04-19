package com.myanatomy.sandboxpro.controller;

import com.myanatomy.sandboxpro.dto.RatingRequest;
import com.myanatomy.sandboxpro.model.Rating;
import com.myanatomy.sandboxpro.model.PickupRequest;
import com.myanatomy.sandboxpro.model.User;
import com.myanatomy.sandboxpro.repository.PickupRequestRepository;
import com.myanatomy.sandboxpro.repository.RatingRepository;
import com.myanatomy.sandboxpro.repository.UserRepository;
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

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PickupRequestRepository pickupRequestRepository;

    /**
     * NGO submits a rating for a donor after delivery.
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

        // Auto-suspend donor if they have 3+ bad ratings (score <= 2)
        long badRatings = ratingRepository.countBadRatingsByDonorPhone(request.getDonorPhone());
        if (badRatings >= 3) {
            donor.setStatus(User.Status.SUSPENDED);
            userRepository.save(donor);
        }

        return ResponseEntity.ok(Map.of("message", "Rating submitted successfully", "score", request.getScore()));
    }

    /**
     * Get average trust score for a donor.
     */
    @GetMapping("/donor/{phone}")
    public ResponseEntity<?> getDonorRating(@PathVariable String phone) {
        Double avg = ratingRepository.getAverageScoreByDonorPhone(phone);
        List<Rating> ratings = ratingRepository.findByDonorPhone(phone);
        return ResponseEntity.ok(Map.of(
                "averageScore", avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0,
                "totalRatings", ratings.size()
        ));
    }
}
