package com.fomov.tasktroveapi.controller;

import com.fomov.tasktroveapi.dto.NotificationDto;
import com.fomov.tasktroveapi.mapper.NotificationMapper;
import com.fomov.tasktroveapi.model.Notification;
import com.fomov.tasktroveapi.security.SecurityUtils;
import com.fomov.tasktroveapi.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;
    private final NotificationMapper mapper;

    public NotificationController(NotificationService service, NotificationMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllNotifications() {
        Integer accountId = SecurityUtils.getCurrentUserId();
        if (accountId == null) {
            return ResponseEntity.status(401).build();
        }
        
        List<Notification> notifications = service.findByAccountId(accountId);
        List<NotificationDto> notificationDtos = notifications.stream()
                .map(mapper::toDto)
                .toList();
        
        Long unreadCount = service.countUnreadByAccountId(accountId);
        
        return ResponseEntity.ok(Map.of(
            "notifications", notificationDtos,
            "unreadCount", unreadCount
        ));
    }

    @GetMapping("/unread")
    public ResponseEntity<Map<String, Object>> getUnreadNotifications() {
        Integer accountId = SecurityUtils.getCurrentUserId();
        if (accountId == null) {
            return ResponseEntity.status(401).build();
        }
        
        List<Notification> notifications = service.findUnreadByAccountId(accountId);
        List<NotificationDto> notificationDtos = notifications.stream()
                .map(mapper::toDto)
                .toList();
        
        return ResponseEntity.ok(Map.of("notifications", notificationDtos));
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        Integer accountId = SecurityUtils.getCurrentUserId();
        if (accountId == null) {
            return ResponseEntity.status(401).build();
        }
        
        Long count = service.countUnreadByAccountId(accountId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Integer id) {
        Integer accountId = SecurityUtils.getCurrentUserId();
        if (accountId == null) {
            return ResponseEntity.status(401).build();
        }
        
        try {
            service.markAsRead(id, accountId);
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        Integer accountId = SecurityUtils.getCurrentUserId();
        if (accountId == null) {
            return ResponseEntity.status(401).build();
        }
        
        service.markAllAsRead(accountId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/all")
    public ResponseEntity<?> deleteAll() {
        Integer accountId = SecurityUtils.getCurrentUserId();
        if (accountId == null) {
            return ResponseEntity.status(401).build();
        }
        
        service.deleteAllByAccountId(accountId);
        return ResponseEntity.ok().build();
    }
}

