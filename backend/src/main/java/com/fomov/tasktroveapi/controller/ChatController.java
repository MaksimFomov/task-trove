package com.fomov.tasktroveapi.controller;

import com.fomov.tasktroveapi.model.Chat;
import com.fomov.tasktroveapi.dto.ChatDto;
import com.fomov.tasktroveapi.mapper.ChatMapper;
import com.fomov.tasktroveapi.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chats")
public class ChatController {

    private final ChatService service;
    private final ChatMapper mapper;

    public ChatController(ChatService service, ChatMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public List<ChatDto> list(@RequestParam(value = "roomName", required = false) String roomName,
                           @RequestParam(value = "customerId", required = false) Integer customerId,
                           @RequestParam(value = "performerId", required = false) Integer performerId) {
        if (roomName != null && !roomName.isBlank()) return service.findByRoomName(roomName).stream().map(mapper::toDto).toList();
        if (customerId != null) return service.findByCustomerId(customerId).stream().map(mapper::toDto).toList();
        if (performerId != null) return service.findByPerformerId(performerId).stream().map(mapper::toDto).toList();
        return service.findAll().stream().map(mapper::toDto).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChatDto> get(@PathVariable Integer id) {
        return service.findById(id).map(mapper::toDto).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ChatDto> create(@RequestBody ChatDto dto) {
        Chat e = mapper.toEntity(dto);
        Chat saved = service.save(e);
        return ResponseEntity.ok(mapper.toDto(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        service.deleteById(id);
        return ResponseEntity.ok().build();
    }
}


