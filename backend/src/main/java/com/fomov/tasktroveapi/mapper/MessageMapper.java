package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.model.Chat;
import com.fomov.tasktroveapi.model.Message;
import com.fomov.tasktroveapi.dto.MessageDto;
import org.springframework.stereotype.Component;

@Component
public class MessageMapper {
    
    public Message toEntity(MessageDto dto) {
        if (dto == null) {
            return null;
        }
        
        Message message = new Message();
        message.setId(dto.getId());
        message.setText(dto.getContent());
        // Chat должен быть установлен отдельно
        return message;
    }
    
    public MessageDto toDto(Message entity) {
        if (entity == null) {
            return null;
        }
        
        MessageDto dto = new MessageDto();
        dto.setId(entity.getId());
        dto.setContent(entity.getText());
        dto.setText(entity.getText());
        dto.setAuthorUserId(entity.getSenderId());
        dto.setSentAt(entity.getCreated());
        
        if (entity.getChat() != null) {
            dto.setChatId(entity.getChat().getId());
            
            // Получаем имя отправителя из чата
            String senderName = getSenderName(entity.getChat(), entity.getSenderId(), entity.getSenderType());
            dto.setSender(senderName);
            dto.setFromWho(senderName);
        }
        
        return dto;
    }
    
    /**
     * Получает имя отправителя из чата
     */
    private String getSenderName(Chat chat, Integer senderId, String senderType) {
        if ("Customer".equals(senderType) && chat.getCustomer() != null) {
            if (chat.getCustomer().getAccount() != null && 
                chat.getCustomer().getAccount().getId().equals(senderId)) {
                return chat.getCustomer().getName();
            }
        } else if ("Performer".equals(senderType) && chat.getPerformer() != null) {
            if (chat.getPerformer().getAccount() != null && 
                chat.getPerformer().getAccount().getId().equals(senderId)) {
                return chat.getPerformer().getName();
            }
        }
        return "Пользователь";
    }
}


