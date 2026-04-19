package com.myanatomy.sandboxpro.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Sends real-time WebSocket notifications to connected clients.
 *
 * Topics:
 *   /topic/listings        - new food listing posted (all NGOs)
 *   /topic/pickups         - pickup status changed (all volunteers)
 *   /topic/ngo/{phone}     - NGO-specific notification
 *   /topic/donor/{phone}   - Donor-specific notification
 *   /topic/volunteer/{phone} - Volunteer-specific notification
 */
@Service
public class NotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notifyNewListing(Map<String, Object> listingData) {
        messagingTemplate.convertAndSend("/topic/listings", listingData);
    }

    public void notifyPickupUpdate(Map<String, Object> pickupData) {
        messagingTemplate.convertAndSend("/topic/pickups", pickupData);
    }

    public void notifyNGO(String ngoPhone, Map<String, Object> data) {
        messagingTemplate.convertAndSend("/topic/ngo/" + ngoPhone, data);
    }

    public void notifyDonor(String donorPhone, Map<String, Object> data) {
        messagingTemplate.convertAndSend("/topic/donor/" + donorPhone, data);
    }

    public void notifyVolunteer(String volunteerPhone, Map<String, Object> data) {
        messagingTemplate.convertAndSend("/topic/volunteer/" + volunteerPhone, data);
    }
}
