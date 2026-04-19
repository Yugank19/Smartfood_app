package com.myanatomy.sandboxpro.repository;

import com.myanatomy.sandboxpro.model.FoodListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FoodListingRepository extends JpaRepository<FoodListing, Long> {

    List<FoodListing> findByStatus(FoodListing.ListingStatus status);

    @Query("SELECT fl FROM FoodListing fl WHERE fl.donor.phone = :phone ORDER BY fl.createdAt DESC")
    List<FoodListing> findByDonorPhoneOrderByCreatedAtDesc(String phone);

    @Query("SELECT fl FROM FoodListing fl WHERE fl.donor.phone = :phone AND fl.status = :status")
    List<FoodListing> findByDonorPhoneAndStatus(String phone, FoodListing.ListingStatus status);

    @Query("SELECT COUNT(fl) FROM FoodListing fl WHERE fl.donor.phone = :phone AND fl.status = :status")
    long countByDonorPhoneAndStatus(String phone, FoodListing.ListingStatus status);

    @Query("SELECT COUNT(fl) FROM FoodListing fl WHERE fl.donor.phone = :phone")
    long countByDonorPhone(String phone);

    @Query("SELECT fl FROM FoodListing fl WHERE fl.status = 'AVAILABLE' AND fl.expiryTime < :now")
    List<FoodListing> findExpiredAvailableListings(LocalDateTime now);

    long countByStatus(FoodListing.ListingStatus status);

    @Query("SELECT COUNT(DISTINCT fl.donor.id) FROM FoodListing fl WHERE fl.donor.role = 'DONOR' AND fl.donor.status = 'ACTIVE'")
    long countActiveDonors();
}
