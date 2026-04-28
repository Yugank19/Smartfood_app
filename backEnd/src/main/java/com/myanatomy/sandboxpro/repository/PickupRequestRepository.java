package com.myanatomy.sandboxpro.repository;

import com.myanatomy.sandboxpro.model.PickupRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PickupRequestRepository extends JpaRepository<PickupRequest, Long> {

    // JOIN FETCH all associations to avoid LazyInitializationException in DTO mapping
    @Query("SELECT pr FROM PickupRequest pr " +
           "JOIN FETCH pr.foodListing fl " +
           "JOIN FETCH fl.donor " +
           "JOIN FETCH pr.ngo " +
           "LEFT JOIN FETCH pr.volunteer " +
           "WHERE pr.status = :status")
    List<PickupRequest> findByStatus(@Param("status") PickupRequest.Status status);

    @Query("SELECT pr FROM PickupRequest pr " +
           "JOIN FETCH pr.foodListing fl " +
           "JOIN FETCH fl.donor " +
           "JOIN FETCH pr.ngo " +
           "LEFT JOIN FETCH pr.volunteer " +
           "WHERE pr.volunteer.phone = :phone " +
           "ORDER BY pr.updatedAt DESC")
    List<PickupRequest> findByVolunteerPhoneOrderByUpdatedAtDesc(@Param("phone") String phone);

    @Query("SELECT pr FROM PickupRequest pr " +
           "JOIN FETCH pr.foodListing fl " +
           "JOIN FETCH fl.donor " +
           "JOIN FETCH pr.ngo " +
           "LEFT JOIN FETCH pr.volunteer " +
           "WHERE pr.ngo.phone = :phone " +
           "ORDER BY pr.createdAt DESC")
    List<PickupRequest> findByNgoPhone(@Param("phone") String phone);

    // Use string literals for enum values in JPQL — Hibernate 6 does not support
    // fully-qualified enum class paths like com.example.Status.VALUE
    @Query("SELECT pr FROM PickupRequest pr " +
           "JOIN FETCH pr.foodListing fl " +
           "JOIN FETCH fl.donor " +
           "JOIN FETCH pr.ngo " +
           "LEFT JOIN FETCH pr.volunteer " +
           "WHERE pr.ngo.phone = :phone " +
           "AND pr.status IN ('PENDING', 'ASSIGNED', 'PICKED_UP') " +
           "ORDER BY pr.createdAt DESC")
    List<PickupRequest> findActiveByNgoPhone(@Param("phone") String phone);

    @Query("SELECT pr FROM PickupRequest pr " +
           "JOIN FETCH pr.foodListing fl " +
           "JOIN FETCH fl.donor d " +
           "JOIN FETCH pr.ngo " +
           "LEFT JOIN FETCH pr.volunteer " +
           "WHERE d.phone = :phone " +
           "AND pr.status <> 'DELIVERED' " +
           "ORDER BY pr.createdAt DESC")
    List<PickupRequest> findActiveByDonorPhone(@Param("phone") String phone);

    @Query("SELECT pr FROM PickupRequest pr " +
           "JOIN FETCH pr.foodListing fl " +
           "JOIN FETCH fl.donor d " +
           "JOIN FETCH pr.ngo " +
           "LEFT JOIN FETCH pr.volunteer " +
           "WHERE d.phone = :phone " +
           "ORDER BY pr.createdAt DESC")
    List<PickupRequest> findAllByDonorPhone(@Param("phone") String phone);

    long countByStatus(PickupRequest.Status status);
}
