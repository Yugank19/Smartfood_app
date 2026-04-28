package com.myanatomy.sandboxpro.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;

/**
 * Feature 4: Real-time Chat System
 * One chat room per pickup request, shared by Donor + NGO + Volunteer.
 */
@Entity
@Table(name = "chat_rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pickup_request_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"foodListing", "ngo", "volunteer", "hibernateLazyInitializer", "handler"})
    private PickupRequest pickupRequest;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private boolean active = true;
}
