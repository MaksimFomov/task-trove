package com.fomov.tasktroveapi.repository;

import com.fomov.tasktroveapi.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Integer> {
    
    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.chat WHERE m.chat.id = :chatId ORDER BY m.created ASC")
    List<Message> findByChatIdWithChat(@Param("chatId") Integer chatId);
    
    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.chat WHERE m.id = :id")
    Optional<Message> findByIdWithChat(@Param("id") Integer id);
    
    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.chat")
    List<Message> findAllWithChat();
    
    // Deprecated: Use findByChatIdWithChat instead
    @Deprecated
    List<Message> findByChat_Id(Integer chatId);
}


