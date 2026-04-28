package com.myanatomy.sandboxpro.controller;

import com.myanatomy.sandboxpro.model.ChatMessage;
import com.myanatomy.sandboxpro.model.ChatRoom;
import com.myanatomy.sandboxpro.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Feature 4: Real-time Chat System
 * REST endpoints for chat history + WebSocket for live messaging.
 */
@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired private ChatService chatService;

    /**
     * Get chat room for a pickup request.
     */
    @GetMapping("/room/{pickupId}")
    public ResponseEntity<?> getChatRoom(@PathVariable Long pickupId) {
        try {
            ChatRoom room = chatService.getRoomByPickupId(pickupId);
            return ResponseEntity.ok(Map.of(
                "roomId", room.getId(),
                "pickupId", pickupId,
                "active", room.isActive()
            ));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get all messages in a chat room.
     */
    @GetMapping("/messages/{roomId}")
    public ResponseEntity<List<ChatMessage>> getMessages(@PathVariable Long roomId) {
        return ResponseEntity.ok(chatService.getMessages(roomId));
    }

    /**
     * Send a message via REST (fallback if WebSocket not available).
     */
    @PostMapping("/send/{roomId}")
    public ResponseEntity<?> sendMessage(
            @PathVariable Long roomId,
            @RequestBody Map<String, String> body) {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        String message = body.get("message");
        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Message cannot be empty"));
        }
        ChatMessage sent = chatService.sendMessage(roomId, phone, message);
        return ResponseEntity.ok(Map.of(
            "id", sent.getId(),
            "message", sent.getMessage(),
            "sentAt", sent.getSentAt().toString()
        ));
    }

    /**
     * WebSocket endpoint for real-time messaging.
     * Client sends to: /app/chat/{roomId}
     * Server broadcasts to: /topic/chat/{roomId}
     */
    @MessageMapping("/chat/{roomId}")
    public void handleWebSocketMessage(
            @DestinationVariable Long roomId,
            @Payload Map<String, String> payload) {
        // Note: In production, extract user from WebSocket session
        // For now, use the phone from payload
        String phone = payload.get("senderPhone");
        String message = payload.get("message");
        if (phone != null && message != null && !message.isBlank()) {
            chatService.sendMessage(roomId, phone, message);
        }
    }
}
