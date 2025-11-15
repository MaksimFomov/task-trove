package com.fomov.tasktroveapi.service;

import com.fomov.tasktroveapi.model.Chat;

public interface ChatAccessService {
    
    /**
     * Проверяет, имеет ли пользователь доступ к чату
     * @param chatId ID чата
     * @param userId ID пользователя
     * @param userRole роль пользователя (Customer, Performer, Administrator)
     * @return true если пользователь имеет доступ к чату
     */
    boolean hasAccessToChat(Integer chatId, Integer userId, String userRole);
    
    /**
     * Проверяет, является ли пользователь участником чата
     * @param chat объект чата
     * @param userId ID пользователя
     * @param userRole роль пользователя
     * @return true если пользователь является участником чата
     */
    boolean isParticipant(Chat chat, Integer userId, String userRole);
}
