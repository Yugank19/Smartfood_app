package com.myanatomy.sandboxpro.service;

import com.myanatomy.sandboxpro.dto.PickupRequestDTO;
import com.myanatomy.sandboxpro.model.FoodListing;
import com.myanatomy.sandboxpro.model.PickupRequest;
import com.myanatomy.sandboxpro.model.User;

import java.util.List;

public interface PickupService {

    PickupRequest createPickupRequest(FoodListing listing, User ngo);

    List<PickupRequestDTO> getAvailablePickups();

    PickupRequest acceptPickup(Long pickupId, String volunteerPhone);

    List<PickupRequestDTO> getMyAssignments(String volunteerPhone);

    PickupRequest updatePickupStatus(Long pickupId, PickupRequest.Status newStatus, String volunteerPhone);
}
