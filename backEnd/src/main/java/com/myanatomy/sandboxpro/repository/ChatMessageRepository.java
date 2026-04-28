package com.myanatomy.sandboxpro.repository;

import com.myanatomy.sandboxpro.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByChatRoomIdOrderBySentAtAsc(Long chatRoomId);
    long countByChatRoomIdAndReadByNgoFalse(Long chatRoomId);
    long countByChatRoomIdAndReadByDonorFalse(Long chatRoomId);
    long countByChatRoomIdAndReadByVolunteerFalse(Long chatRoomId);
}
