package com.myanatomy.sandboxpro.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

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

    @Column(nullable = true)
    @JsonIgnore
    private String pin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    private String organizationName;
    private String address;

    private Double latitude;
    private Double longitude;

    private boolean organizationVerified = false;
    private String verificationNotes;

    @Column(name = "is_phone_verified", nullable = false)
    private boolean phoneVerified = false;

    // Feature 6: Trust Score System
    private Double trustScore = 5.0;          // composite score 0-10
    private Integer totalDeliveries = 0;
    private Integer totalCancellations = 0;
    private Integer totalRatings = 0;
    private Double averageRating = 0.0;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Role {
        DONOR, NGO, VOLUNTEER, ADMIN, ANIMAL_CARE  // Feature 7: Animal Care role
    }

    public enum Status {
        ACTIVE, SUSPENDED, PENDING_VERIFICATION
    }
}
