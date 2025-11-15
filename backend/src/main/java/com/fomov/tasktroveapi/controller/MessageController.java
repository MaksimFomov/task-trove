package com.fomov.tasktroveapi.controller;

import com.fomov.tasktroveapi.model.Message;
import com.fomov.tasktroveapi.dto.MessageDto;
import com.fomov.tasktroveapi.mapper.MessageMapper;
import com.fomov.tasktroveapi.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService service;
    private final MessageMapper mapper;

    public MessageController(MessageService service, MessageMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public List<MessageDto> list(@RequestParam(value = "chatId", required = false) Integer chatId) {
        if (chatId != null) return service.findByChatId(chatId).stream().map(mapper::toDto).toList();
        return service.findAll().stream().map(mapper::toDto).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MessageDto> get(@PathVariable Integer id) {
        return service.findById(id).map(mapper::toDto).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        service.deleteById(id);
        return ResponseEntity.ok().build();
    }
}


