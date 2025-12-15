package com.fomov.tasktroveapi.service;

import com.fomov.tasktroveapi.model.Chat;

import java.util.List;
import java.util.Optional;

public interface ChatService {
    List<Chat> findAll();
    Optional<Chat> findById(Integer id);
    Chat save(Chat chat);
    void deleteById(Integer id);
    List<Chat> findByRoomName(String roomName);
    List<Chat> findByCustomerId(Integer customerId);
    List<Chat> findByPerformerId(Integer performerId);
    List<Chat> findByCustomerIdAndPerformerId(Integer customerId, Integer performerId);
    List<Chat> findByCustomerIdAndPerformerIdIgnoreDeleted(Integer customerId, Integer performerId);
}


