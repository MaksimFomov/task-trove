package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.model.Chat;
import com.fomov.tasktroveapi.dto.ChatDto;
import org.springframework.stereotype.Component;

@Component
public class ChatMapper {
    
    public Chat toEntity(ChatDto dto) {
        if (dto == null) {
            return null;
        }
        
        Chat chat = new Chat();
        chat.setId(dto.getId());
        chat.setRoomName(dto.getRoomName());
        // Customer and Performer должны быть установлены отдельно
        return chat;
    }
    
    public ChatDto toDto(Chat entity) {
        if (entity == null) {
            return null;
        }
        
        ChatDto dto = new ChatDto();
        dto.setId(entity.getId());
        dto.setRoomName(entity.getRoomName());
        dto.setCustomerId(entity.getCustomerId());
        dto.setPerformerId(entity.getPerformerId());
        
        // Добавляем имена
        if (entity.getCustomer() != null) {
            dto.setCustomerName(entity.getCustomer().getName());
        }
        if (entity.getPerformer() != null) {
            dto.setPerformerName(entity.getPerformer().getName());
        }
        
        // Извлекаем название заказа из roomName
        // Формат: "Order #14: Сделать сайт" -> "Сделать сайт"
        String roomName = entity.getRoomName();
        if (roomName != null && roomName.contains(": ")) {
            String[] parts = roomName.split(": ", 2);
            if (parts.length == 2) {
                dto.setOrderTitle(parts[1]);
            } else {
                dto.setOrderTitle(roomName);
            }
        } else {
            dto.setOrderTitle(roomName);
        }
        
        // Добавляем информацию об удалении
        dto.setDeletedByCustomer(entity.getDeletedByCustomer());
        dto.setDeletedByPerformer(entity.getDeletedByPerformer());
        
        return dto;
    }
}


