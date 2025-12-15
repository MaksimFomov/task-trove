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
        
        // Добавляем имена (используем getFullName для получения ФИО)
        if (entity.getCustomer() != null) {
            dto.setCustomerName(entity.getCustomer().getFullName());
        }
        if (entity.getPerformer() != null) {
            dto.setPerformerName(entity.getPerformer().getFullName());
        }
        
        // Извлекаем названия проектов из roomName
        // Формат: "Order #14: Сделать сайт" или "Order #14: Сайт, Order #15: Приложение"
        String roomName = entity.getRoomName();
        if (roomName != null) {
            // Если есть несколько проектов через запятую, извлекаем все названия
            if (roomName.contains(", ")) {
                // Разделяем по ", " и извлекаем названия после ": "
                StringBuilder titles = new StringBuilder();
                String[] parts = roomName.split(", ");
                for (String part : parts) {
                    if (part.contains(": ")) {
                        String[] orderParts = part.split(": ", 2);
                        if (orderParts.length == 2) {
                            if (titles.length() > 0) {
                                titles.append(", ");
                            }
                            titles.append(orderParts[1]);
                        }
                    }
                }
                dto.setOrderTitle(titles.length() > 0 ? titles.toString() : roomName);
            } else if (roomName.contains(": ")) {
                // Один проект
            String[] parts = roomName.split(": ", 2);
            if (parts.length == 2) {
                dto.setOrderTitle(parts[1]);
            } else {
                dto.setOrderTitle(roomName);
            }
        } else {
            dto.setOrderTitle(roomName);
            }
        } else {
            dto.setOrderTitle(null);
        }
        
        // Добавляем информацию об удалении
        dto.setDeletedByCustomer(entity.getDeletedByCustomer());
        dto.setDeletedByPerformer(entity.getDeletedByPerformer());
        dto.setLastMessageTime(entity.getLastMessageTime());
        
        return dto;
    }
}


