package com.myanatomy.sandboxpro.service;

import com.myanatomy.sandboxpro.model.User;
import com.myanatomy.sandboxpro.repository.RatingRepository;
import com.myanatomy.sandboxpro.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Feature 6: Trust Score System
 *
 * Formula:
 *   trustScore = (avgRating/5 * 0.5) + (completionRate * 0.3) + ((1 - cancellationRate) * 0.2)
 *   Result scaled to 0–10.
 *
 * Auto-suspend: if trustScore < 3.0 AND totalDeliveries >= 5
 */
@Service
public class TrustScoreService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RatingRepository ratingRepository;

    /**
     * Recalculates and persists the trust score for a user after a delivery or rating event.
     */
    @Transactional
    public void recalculate(User user) {
        int deliveries    = user.getTotalDeliveries()    != null ? user.getTotalDeliveries()    : 0;
        int cancellations = user.getTotalCancellations() != null ? user.getTotalCancellations() : 0;
        int totalAttempts = deliveries + cancellations;

        // Completion rate: deliveries / (deliveries + cancellations)
        double completionRate = totalAttempts > 0 ? (double) deliveries / totalAttempts : 1.0;

        // Cancellation rate
        double cancellationRate = totalAttempts > 0 ? (double) cancellations / totalAttempts : 0.0;

        // Average rating (1–5 scale), default 5 if no ratings yet
        Double avgRating = ratingRepository.getAverageScoreByDonorPhone(user.getPhone());
        double ratingScore = (avgRating != null) ? avgRating : 5.0;

        // Composite score (0–10)
        double score = ((ratingScore / 5.0) * 0.5 + completionRate * 0.3 + (1.0 - cancellationRate) * 0.2) * 10.0;
        score = Math.round(score * 10.0) / 10.0; // round to 1 decimal

        user.setTrustScore(score);
        user.setAverageRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 5.0);

        // Auto-suspend if trust score is critically low and user has enough history
        if (score < 3.0 && deliveries >= 5) {
            user.setStatus(User.Status.SUSPENDED);
        }

        userRepository.save(user);
    }

    /**
     * Called after a successful delivery — increments delivery count and recalculates.
     */
    @Transactional
    public void recordDelivery(User user) {
        user.setTotalDeliveries((user.getTotalDeliveries() != null ? user.getTotalDeliveries() : 0) + 1);
        recalculate(user);
    }

    /**
     * Called after a cancellation — increments cancellation count and recalculates.
     */
    @Transactional
    public void recordCancellation(User user) {
        user.setTotalCancellations((user.getTotalCancellations() != null ? user.getTotalCancellations() : 0) + 1);
        recalculate(user);
    }
}
