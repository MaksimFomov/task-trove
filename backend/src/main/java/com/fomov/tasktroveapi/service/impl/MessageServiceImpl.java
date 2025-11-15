package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.model.Message;
import com.fomov.tasktroveapi.repository.MessageRepository;
import com.fomov.tasktroveapi.service.MessageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class MessageServiceImpl implements MessageService {

    private final MessageRepository repository;

    public MessageServiceImpl(MessageRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<Message> findAll() { 
        return repository.findAllWithChat(); 
    }

    @Override
    public Optional<Message> findById(Integer id) { 
        return repository.findByIdWithChat(id); 
    }

    @Override
    public Message save(Message message) { return repository.save(message); }

    @Override
    public void deleteById(Integer id) { repository.deleteById(id); }

    @Override
    public List<Message> findByChatId(Integer chatId) { 
        return repository.findByChatIdWithChat(chatId); 
    }
}


