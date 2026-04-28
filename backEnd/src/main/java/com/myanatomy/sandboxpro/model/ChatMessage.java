package com.myanatomy.sandboxpro.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;

/**
 * Feature 4: Real-time Chat Message
 */
@Entity
@Table(name = "chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "chat_room_id", nullable = false)
    @JsonIgnoreProperties({"pickupRequest", "hibernateLazyInitializer", "handler"})
    private ChatRoom chatRoom;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sender_id", nullable = false)
    @JsonIgnoreProperties({"pin", "hibernateLazyInitializer", "handler"})
    private User sender;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(nullable = false)
    private LocalDateTime sentAt = LocalDateTime.now();

    private boolean readByNgo = false;
    private boolean readByDonor = false;
    private boolean readByVolunteer = false;

    @Enumerated(EnumType.STRING)
    private MessageType type = MessageType.TEXT;

    public enum MessageType {
        TEXT, IMAGE, SYSTEM
    }
}
