package com.fomov.tasktroveapi.websocket;

import com.fomov.tasktroveapi.model.Account;
import com.fomov.tasktroveapi.model.Chat;
import com.fomov.tasktroveapi.model.Message;
import com.fomov.tasktroveapi.repository.AccountRepository;
import com.fomov.tasktroveapi.service.ChatAccessService;
import com.fomov.tasktroveapi.service.ChatService;
import com.fomov.tasktroveapi.service.MessageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.time.OffsetDateTime;

@Controller
public class ChatWebSocketController {

    private static final Logger logger = LoggerFactory.getLogger(ChatWebSocketController.class);
    
    private final MessageService messageService;
    private final ChatService chatService;
    private final ChatAccessService chatAccessService;
    private final SimpMessagingTemplate messagingTemplate;
    private final AccountRepository accountRepository;

    public ChatWebSocketController(
            MessageService messageService, 
            ChatService chatService,
            ChatAccessService chatAccessService,
            SimpMessagingTemplate messagingTemplate,
            AccountRepository accountRepository) {
        this.messageService = messageService;
        this.chatService = chatService;
        this.chatAccessService = chatAccessService;
        this.messagingTemplate = messagingTemplate;
        this.accountRepository = accountRepository;
    }

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        // Получаем аутентифицированного пользователя
        Authentication auth = (Authentication) headerAccessor.getUser();
        if (auth == null) {
            logger.error("Unauthenticated user attempted to send message");
            return;
        }
        
        Integer userId = (Integer) auth.getPrincipal();
        String userRole = auth.getAuthorities().iterator().next().getAuthority();
        
        // Проверяем валидность данных
        if (chatMessage.getChatId() == null) {
            logger.error("Message without chatId from userId={}", userId);
            return;
        }
        
        // Проверяем доступ к чату
        if (!chatAccessService.hasAccessToChat(chatMessage.getChatId(), userId, userRole)) {
            logger.error("Access denied: userId={} attempted to send message to chatId={}", 
                userId, chatMessage.getChatId());
            return;
        }
        
        // Получаем чат
        Chat chat = chatService.findById(chatMessage.getChatId()).orElse(null);
        if (chat == null) {
            logger.error("Chat not found: chatId={}", chatMessage.getChatId());
            return;
        }
        
        // Проверяем, не удален ли чат другим участником
        boolean isChatDeletedByOther = false;
        String deletedByMessage = null;
        if ("Customer".equals(userRole)) {
            // Если заказчик пытается отправить сообщение, проверяем, не удалил ли исполнитель чат
            if (Boolean.TRUE.equals(chat.getDeletedByPerformer())) {
                isChatDeletedByOther = true;
                deletedByMessage = "Чат был удален исполнителем. Вы не можете отправлять сообщения в этот чат.";
            }
        } else if ("Performer".equals(userRole)) {
            // Если исполнитель пытается отправить сообщение, проверяем, не удалил ли заказчик чат
            if (Boolean.TRUE.equals(chat.getDeletedByCustomer())) {
                isChatDeletedByOther = true;
                deletedByMessage = "Чат был удален заказчиком. Вы не можете отправлять сообщения в этот чат.";
            }
        }
        
        // Если чат удален другим участником, отправляем ошибку обратно отправителю
        if (isChatDeletedByOther) {
            logger.warn("User {} attempted to send message to deleted chat {}", userId, chatMessage.getChatId());
            ChatMessage errorMessage = new ChatMessage();
            errorMessage.setChatId(chatMessage.getChatId());
            errorMessage.setType(ChatMessage.MessageType.ERROR);
            errorMessage.setContent(deletedByMessage);
            errorMessage.setSenderId(userId);
            errorMessage.setSenderType(userRole);
            
            // Отправляем ошибку только отправителю
            messagingTemplate.convertAndSendToUser(
                userId.toString(), 
                "/queue/errors", 
                errorMessage
            );
            return;
        }
        
        // Получаем имя отправителя
        String senderName = getSenderName(chat, userId, userRole);
        
        // Получаем Account для отправителя
        Account senderAccount = accountRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Account not found for userId: " + userId));
        
        // Создаем и сохраняем сообщение
        Message message = new Message();
        message.setText(chatMessage.getContent());
        message.setChat(chat);
        message.setSender(senderAccount);
        message.setSenderType(userRole);
        message.setCreated(OffsetDateTime.now());
        
        Message savedMessage = messageService.save(message);
        
        // Помечаем чат как непрочитанный для получателя
        if ("Customer".equals(userRole)) {
            chat.setCheckByCustomer(true); // Отправитель прочитал (отправил сообщение)
            chat.setCheckByPerformer(false); // Получатель не прочитал
        } else if ("Performer".equals(userRole)) {
            chat.setCheckByPerformer(true); // Отправитель прочитал (отправил сообщение)
            chat.setCheckByCustomer(false); // Получатель не прочитал
        }
        chatService.save(chat);
        
        // Обновляем chatMessage с реальными данными
        chatMessage.setSenderId(userId);
        chatMessage.setSenderType(userRole);
        chatMessage.setSender(senderName);
        chatMessage.setType(ChatMessage.MessageType.CHAT);
        chatMessage.setMessageId(savedMessage.getId());
        chatMessage.setCreatedAt(savedMessage.getCreated());
        
        // Отправляем сообщение только участникам чата
        String destination = "/topic/chat." + chatMessage.getChatId();
        messagingTemplate.convertAndSend(destination, chatMessage);
        
        logger.info("Message sent: userId={}, chatId={}, messageId={}", 
            userId, chatMessage.getChatId(), savedMessage.getId());
    }

    @MessageMapping("/chat.addUser")
    public void addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        // Получаем аутентифицированного пользователя
        Authentication auth = (Authentication) headerAccessor.getUser();
        if (auth == null) {
            logger.error("Unauthenticated user attempted to join chat");
            return;
        }
        
        Integer userId = (Integer) auth.getPrincipal();
        String userRole = auth.getAuthorities().iterator().next().getAuthority();
        
        // Проверяем валидность данных
        if (chatMessage.getChatId() == null) {
            logger.error("Join attempt without chatId from userId={}", userId);
            return;
        }
        
        // Проверяем доступ к чату
        if (!chatAccessService.hasAccessToChat(chatMessage.getChatId(), userId, userRole)) {
            logger.error("Access denied: userId={} attempted to join chatId={}", 
                userId, chatMessage.getChatId());
            return;
        }
        
        // Сохраняем информацию в сессии
        headerAccessor.getSessionAttributes().put("userId", userId);
        headerAccessor.getSessionAttributes().put("userRole", userRole);
        headerAccessor.getSessionAttributes().put("chatId", chatMessage.getChatId());
        
        // Отправляем уведомление о присоединении только в этот чат
        chatMessage.setType(ChatMessage.MessageType.JOIN);
        chatMessage.setSenderId(userId);
        chatMessage.setSenderType(userRole);
        
        String destination = "/topic/chat." + chatMessage.getChatId();
        messagingTemplate.convertAndSend(destination, chatMessage);
        
        logger.info("User joined chat: userId={}, userRole={}, chatId={}", 
            userId, userRole, chatMessage.getChatId());
    }
    
    /**
     * Получает имя отправителя из чата по userId и роли
     */
    private String getSenderName(Chat chat, Integer userId, String userRole) {
        if ("Customer".equals(userRole) && chat.getCustomer() != null) {
            if (chat.getCustomer().getAccount() != null && 
                chat.getCustomer().getAccount().getId().equals(userId)) {
                return chat.getCustomer().getFullName();
            }
        } else if ("Performer".equals(userRole) && chat.getPerformer() != null) {
            if (chat.getPerformer().getAccount() != null && 
                chat.getPerformer().getAccount().getId().equals(userId)) {
                return chat.getPerformer().getFullName();
            }
        }
        return "Пользователь";
    }

    public static class ChatMessage {
        private String content;
        private String sender;
        private String room;
        private Integer chatId;
        private Integer senderId;
        private String senderType;
        private MessageType type;
        private Integer messageId;
        private OffsetDateTime createdAt;

        public enum MessageType {
            CHAT, JOIN, LEAVE, ERROR
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public String getSender() {
            return sender;
        }

        public void setSender(String sender) {
            this.sender = sender;
        }

        public String getRoom() {
            return room;
        }

        public void setRoom(String room) {
            this.room = room;
        }

        public Integer getChatId() {
            return chatId;
        }

        public void setChatId(Integer chatId) {
            this.chatId = chatId;
        }

        public Integer getSenderId() {
            return senderId;
        }

        public void setSenderId(Integer senderId) {
            this.senderId = senderId;
        }

        public String getSenderType() {
            return senderType;
        }

        public void setSenderType(String senderType) {
            this.senderType = senderType;
        }

        public MessageType getType() {
            return type;
        }

        public void setType(MessageType type) {
            this.type = type;
        }

        public Integer getMessageId() {
            return messageId;
        }

        public void setMessageId(Integer messageId) {
            this.messageId = messageId;
        }

        public OffsetDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
        }
    }
}

