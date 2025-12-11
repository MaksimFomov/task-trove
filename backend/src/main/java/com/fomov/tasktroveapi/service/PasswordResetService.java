package com.fomov.tasktroveapi.service;

public interface PasswordResetService {
    /**
     * Отправляет код восстановления пароля на указанный email
     * @param email email адрес для отправки кода
     */
    void sendPasswordResetCode(String email);
    
    /**
     * Проверяет код восстановления пароля для указанного email
     * @param email email адрес
     * @param code код восстановления
     * @return true если код верный и не истек, false в противном случае
     */
    boolean verifyResetCode(String email, String code);
    
    /**
     * Сбрасывает пароль для указанного email после проверки кода
     * @param email email адрес
     * @param code код восстановления
     * @param newPassword новый пароль
     */
    void resetPassword(String email, String code, String newPassword);
    
    /**
     * Удаляет код восстановления для указанного email
     * @param email email адрес
     */
    void removeResetCode(String email);
}
