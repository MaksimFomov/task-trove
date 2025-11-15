package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.model.Chat;
import com.fomov.tasktroveapi.repository.ChatRepository;
import com.fomov.tasktroveapi.service.ChatService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ChatServiceImpl implements ChatService {

    private final ChatRepository repository;

    public ChatServiceImpl(ChatRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<Chat> findAll() { 
        return repository.findAllWithRelations(); 
    }

    @Override
    public Optional<Chat> findById(Integer id) { 
        return repository.findByIdWithRelations(id); 
    }

    @Override
    public Chat save(Chat chat) { return repository.save(chat); }

    @Override
    public void deleteById(Integer id) { repository.deleteById(id); }

    @Override
    public List<Chat> findByRoomName(String roomName) { 
        return repository.findByRoomNameWithRelations(roomName); 
    }

    @Override
    public List<Chat> findByCustomerId(Integer customerId) { 
        return repository.findByCustomerIdWithRelations(customerId); 
    }

    @Override
    public List<Chat> findByPerformerId(Integer performerId) { 
        return repository.findByPerformerIdWithRelations(performerId); 
    }
}


