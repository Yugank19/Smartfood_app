package com.myanatomy.sandboxpro.repository;

import com.myanatomy.sandboxpro.model.PickupRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PickupRequestRepository extends JpaRepository<PickupRequest, Long> {

    List<PickupRequest> findByStatus(PickupRequest.Status status);

    @Query("SELECT pr FROM PickupRequest pr WHERE pr.volunteer.phone = :phone ORDER BY pr.updatedAt DESC")
    List<PickupRequest> findByVolunteerPhoneOrderByUpdatedAtDesc(String phone);

    @Query("SELECT pr FROM PickupRequest pr WHERE pr.ngo.phone = :phone ORDER BY pr.createdAt DESC")
    List<PickupRequest> findByNgoPhone(String phone);

    @Query("SELECT pr FROM PickupRequest pr WHERE pr.ngo.phone = :phone AND pr.status IN ('PENDING', 'ASSIGNED', 'PICKED_UP') ORDER BY pr.createdAt DESC")
    List<PickupRequest> findActiveByNgoPhone(String phone);

    long countByStatus(PickupRequest.Status status);
}
