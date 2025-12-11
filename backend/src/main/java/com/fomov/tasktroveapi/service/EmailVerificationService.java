package com.fomov.tasktroveapi.service;

public interface EmailVerificationService {
    /**
     * Генерирует и отправляет код подтверждения на указанный email
     * @param email email адрес для отправки кода
     */
    void sendVerificationCode(String email);
    
    /**
     * Проверяет код подтверждения для указанного email
     * @param email email адрес
     * @param code код подтверждения
     * @return true если код верный и не истек, false в противном случае
     */
    boolean verifyCode(String email, String code);
    
    /**
     * Удаляет код подтверждения для указанного email (после успешной проверки)
     * @param email email адрес
     */
    void removeCode(String email);
}
