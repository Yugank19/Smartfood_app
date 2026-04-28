package com.myanatomy.sandboxpro.service;

import com.myanatomy.sandboxpro.model.ChatMessage;
import com.myanatomy.sandboxpro.model.ChatRoom;
import com.myanatomy.sandboxpro.model.PickupRequest;
import com.myanatomy.sandboxpro.model.User;
import com.myanatomy.sandboxpro.repository.ChatMessageRepository;
import com.myanatomy.sandboxpro.repository.ChatRoomRepository;
import com.myanatomy.sandboxpro.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Feature 4: Real-time Chat System
 */
@Service
public class ChatService {

    @Autowired private ChatRoomRepository chatRoomRepository;
    @Autowired private ChatMessageRepository chatMessageRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    /**
     * Creates a chat room when NGO accepts a listing.
     */
    @Transactional
    public ChatRoom createChatRoom(PickupRequest pickupRequest) {
        return chatRoomRepository.findByPickupRequestId(pickupRequest.getId())
                .orElseGet(() -> {
                    ChatRoom room = new ChatRoom();
                    room.setPickupRequest(pickupRequest);
                    ChatRoom saved = chatRoomRepository.save(room);
                    // Send system message
                    sendSystemMessage(saved.getId(),
                        "Chat started. Participants: " +
                        pickupRequest.getFoodListing().getDonor().getFullName() +
                        " (Donor), " + pickupRequest.getNgo().getFullName() + " (NGO)");
                    return saved;
                });
    }

    /**
     * Sends a message and broadcasts via WebSocket.
     */
    @Transactional
    public ChatMessage sendMessage(Long roomId, String senderPhone, String messageText) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found"));
        User sender = userRepository.findByPhone(senderPhone)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ChatMessage msg = new ChatMessage();
        msg.setChatRoom(room);
        msg.setSender(sender);
        msg.setMessage(messageText);
        msg.setType(ChatMessage.MessageType.TEXT);
        ChatMessage saved = chatMessageRepository.save(msg);

        // Broadcast to all participants via WebSocket
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, Map.of(
            "id", saved.getId(),
            "senderName", sender.getFullName(),
            "senderPhone", sender.getPhone(),
            "senderRole", sender.getRole().name(),
            "message", messageText,
            "sentAt", saved.getSentAt().toString(),
            "type", "TEXT"
        ));

        return saved;
    }

    public List<ChatMessage> getMessages(Long roomId) {
        return chatMessageRepository.findByChatRoomIdOrderBySentAtAsc(roomId);
    }

    public ChatRoom getRoomByPickupId(Long pickupId) {
        return chatRoomRepository.findByPickupRequestId(pickupId)
                .orElseThrow(() -> new RuntimeException("Chat room not found for pickup " + pickupId));
    }

    private void sendSystemMessage(Long roomId, String text) {
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, Map.of(
            "message", text,
            "type", "SYSTEM",
            "sentAt", java.time.LocalDateTime.now().toString()
        ));
    }
}
