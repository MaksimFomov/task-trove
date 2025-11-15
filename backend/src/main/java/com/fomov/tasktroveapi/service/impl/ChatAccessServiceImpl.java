package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.model.Chat;
import com.fomov.tasktroveapi.service.ChatAccessService;
import com.fomov.tasktroveapi.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ChatAccessServiceImpl implements ChatAccessService {

    private static final Logger logger = LoggerFactory.getLogger(ChatAccessServiceImpl.class);
    private final ChatService chatService;

    public ChatAccessServiceImpl(ChatService chatService) {
        this.chatService = chatService;
    }

    @Override
    public boolean hasAccessToChat(Integer chatId, Integer userId, String userRole) {
        if (chatId == null || userId == null || userRole == null) {
            logger.warn("Invalid parameters: chatId={}, userId={}, userRole={}", chatId, userId, userRole);
            return false;
        }

        Optional<Chat> chatOpt = chatService.findById(chatId);
        if (chatOpt.isEmpty()) {
            logger.warn("Chat not found: chatId={}", chatId);
            return false;
        }

        Chat chat = chatOpt.get();
        return isParticipant(chat, userId, userRole);
    }

    @Override
    public boolean isParticipant(Chat chat, Integer userId, String userRole) {
        if (chat == null || userId == null || userRole == null) {
            return false;
        }

        boolean hasAccess = switch (userRole) {
            case "Customer" -> {
                // userId - это accountId, нужно сравнивать с account.getId() из Customer
                Integer customerAccountId = chat.getCustomer() != null && chat.getCustomer().getAccount() != null 
                    ? chat.getCustomer().getAccount().getId() 
                    : null;
                yield customerAccountId != null && customerAccountId.equals(userId);
            }
            case "Performer" -> {
                // userId - это accountId, нужно сравнивать с account.getId() из Performer
                Integer performerAccountId = chat.getPerformer() != null && chat.getPerformer().getAccount() != null 
                    ? chat.getPerformer().getAccount().getId() 
                    : null;
                yield performerAccountId != null && performerAccountId.equals(userId);
            }
            case "Administrator" -> {
                // Администраторы имеют доступ ко всем чатам
                yield true;
            }
            default -> {
                logger.warn("Unknown user role: {}", userRole);
                yield false;
            }
        };

        if (!hasAccess) {
            logger.warn("Access denied: userId={}, userRole={}, chatId={}", userId, userRole, chat.getId());
        }

        return hasAccess;
    }
}
