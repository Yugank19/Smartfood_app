package com.myanatomy.sandboxpro.repository;

import com.myanatomy.sandboxpro.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {

    List<Rating> findByDonorPhone(String phone);

    // Ratings given by an NGO
    List<Rating> findByNgoPhone(String phone);

    @Query("SELECT AVG(r.score) FROM Rating r WHERE r.donor.phone = :phone")
    Double getAverageScoreByDonorPhone(String phone);

    @Query("SELECT COUNT(r) FROM Rating r WHERE r.donor.phone = :phone AND r.score <= 2")
    long countBadRatingsByDonorPhone(String phone);
}
