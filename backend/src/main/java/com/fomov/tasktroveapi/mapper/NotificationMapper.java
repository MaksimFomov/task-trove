package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.model.Notification;
import com.fomov.tasktroveapi.dto.NotificationDto;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {
    
    public NotificationDto toDto(Notification entity) {
        if (entity == null) {
            return null;
        }
        
        NotificationDto dto = new NotificationDto();
        dto.setId(entity.getId());
        dto.setAccountId(entity.getAccountId());
        dto.setUserRole(entity.getUserRole());
        dto.setType(entity.getType());
        dto.setTitle(entity.getTitle());
        dto.setMessage(entity.getMessage());
        dto.setIsRead(entity.getIsRead());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setRelatedOrderId(entity.getRelatedOrderId());
        dto.setRelatedPerformerId(entity.getRelatedPerformerId());
        dto.setRelatedCustomerId(entity.getRelatedCustomerId());
        
        return dto;
    }
    
    public Notification toEntity(NotificationDto dto) {
        if (dto == null) {
            return null;
        }
        
        Notification notification = new Notification();
        notification.setId(dto.getId());
        notification.setAccountId(dto.getAccountId());
        notification.setUserRole(dto.getUserRole());
        notification.setType(dto.getType());
        notification.setTitle(dto.getTitle());
        notification.setMessage(dto.getMessage());
        notification.setIsRead(dto.getIsRead());
        notification.setCreatedAt(dto.getCreatedAt());
        notification.setRelatedOrderId(dto.getRelatedOrderId());
        notification.setRelatedPerformerId(dto.getRelatedPerformerId());
        notification.setRelatedCustomerId(dto.getRelatedCustomerId());
        
        return notification;
    }
}

