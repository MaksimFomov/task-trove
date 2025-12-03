package com.fomov.tasktroveapi.service;

import com.fomov.tasktroveapi.model.Message;

import java.util.List;
import java.util.Optional;

public interface MessageService {
    List<Message> findAll();
    Optional<Message> findById(Integer id);
    Message save(Message message);
    void deleteById(Integer id);
    List<Message> findByChatId(Integer chatId);
    Long countUnreadMessages(Integer chatId, Integer userId, java.time.OffsetDateTime lastCheckedTime);
}


