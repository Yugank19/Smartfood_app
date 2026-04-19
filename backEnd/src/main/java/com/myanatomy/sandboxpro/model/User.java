package com.myanatomy.sandboxpro.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String phone;

    // PIN stored as BCrypt hash
    @Column(nullable = true)
    private String pin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    private String organizationName;
    private String address;

    // Geocoded coordinates from address (stored so food listings inherit them)
    private Double latitude;
    private Double longitude;

    // Donor verification status (PDF requirement: only verified donors can post food)
    private boolean organizationVerified = false;
    private String verificationNotes;

    @Column(name = "is_phone_verified", nullable = false)
    private boolean phoneVerified = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Role {
        DONOR, NGO, VOLUNTEER, ADMIN
    }

    public enum Status {
        ACTIVE, SUSPENDED, PENDING_VERIFICATION
    }
}
