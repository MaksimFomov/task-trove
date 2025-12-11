package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.model.Account;
import com.fomov.tasktroveapi.repository.AccountRepository;
import com.fomov.tasktroveapi.service.EmailService;
import com.fomov.tasktroveapi.service.PasswordResetService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PasswordResetServiceImpl implements PasswordResetService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetServiceImpl.class);
    
    // Хранилище кодов восстановления: email -> {code, expirationTime}
    private final Map<String, ResetCodeData> resetCodes = new ConcurrentHashMap<>();
    
    // Время жизни кода в минутах
    private static final int CODE_EXPIRATION_MINUTES = 15;
    
    private final EmailService emailService;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();

    public PasswordResetServiceImpl(EmailService emailService,
                                   AccountRepository accountRepository,
                                   PasswordEncoder passwordEncoder) {
        this.emailService = emailService;
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public void sendPasswordResetCode(String email) {
        // Нормализуем email
        String normalizedEmail = email.trim().toLowerCase();
        
        // Проверяем, существует ли аккаунт с таким email
        Account account = accountRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("Аккаунт с таким email не найден"));
        
        // Генерируем 6-значный код
        String code = String.format("%06d", random.nextInt(1000000));
        
        // Сохраняем код с временем истечения
        LocalDateTime expirationTime = LocalDateTime.now().plusMinutes(CODE_EXPIRATION_MINUTES);
        resetCodes.put(normalizedEmail, new ResetCodeData(code, expirationTime));
        
        // Отправляем email
        String subject = "Код восстановления пароля - TaskTrove";
        String text = String.format(
            "Здравствуйте!\n\n" +
            "Вы запросили восстановление пароля для вашего аккаунта.\n\n" +
            "Ваш код восстановления: %s\n\n" +
            "Код действителен в течение %d минут.\n\n" +
            "Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.\n\n" +
            "С уважением,\n" +
            "Команда TaskTrove",
            code, CODE_EXPIRATION_MINUTES
        );
        
        try {
            emailService.sendEmail(normalizedEmail, subject, text);
            logger.info("Password reset code sent to email: {}", normalizedEmail);
        } catch (Exception e) {
            logger.error("Failed to send password reset code to email: {}", normalizedEmail, e);
            resetCodes.remove(normalizedEmail);
            throw new RuntimeException("Не удалось отправить код восстановления", e);
        }
    }

    @Override
    public boolean verifyResetCode(String email, String code) {
        String normalizedEmail = email.trim().toLowerCase();
        ResetCodeData data = resetCodes.get(normalizedEmail);
        
        if (data == null) {
            logger.warn("No password reset code found for email: {}", normalizedEmail);
            return false;
        }
        
        // Проверяем, не истек ли код
        if (LocalDateTime.now().isAfter(data.expirationTime)) {
            logger.warn("Password reset code expired for email: {}", normalizedEmail);
            resetCodes.remove(normalizedEmail);
            return false;
        }
        
        // Проверяем код
        boolean isValid = data.code.equals(code);
        if (isValid) {
            logger.info("Password reset code verified successfully for email: {}", normalizedEmail);
        } else {
            logger.warn("Invalid password reset code for email: {}", normalizedEmail);
        }
        
        return isValid;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void resetPassword(String email, String code, String newPassword) {
        String normalizedEmail = email.trim().toLowerCase();
        
        // Проверяем код
        if (!verifyResetCode(normalizedEmail, code)) {
            throw new RuntimeException("Неверный код восстановления или код истек");
        }
        
        // Проверяем новый пароль
        if (newPassword == null || newPassword.trim().isEmpty()) {
            throw new RuntimeException("Новый пароль обязателен");
        }
        if (newPassword.length() < 8) {
            throw new RuntimeException("Пароль должен содержать минимум 8 символов");
        }
        
        // Находим аккаунт
        Account account = accountRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("Аккаунт с таким email не найден"));
        
        // Обновляем пароль
        account.setPassword(passwordEncoder.encode(newPassword));
        accountRepository.save(account);
        
        // Удаляем код после успешного сброса
        resetCodes.remove(normalizedEmail);
        
        logger.info("Password reset successfully for email: {}", normalizedEmail);
    }

    @Override
    public void removeResetCode(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        resetCodes.remove(normalizedEmail);
        logger.info("Password reset code removed for email: {}", normalizedEmail);
    }
    
    /**
     * Периодическая очистка истекших кодов (каждые 5 минут)
     */
    @Scheduled(fixedRate = 300000) // 5 минут
    public void cleanupExpiredCodes() {
        LocalDateTime now = LocalDateTime.now();
        resetCodes.entrySet().removeIf(entry -> 
            now.isAfter(entry.getValue().expirationTime)
        );
        logger.debug("Cleaned up expired password reset codes");
    }
    
    /**
     * Внутренний класс для хранения данных кода восстановления
     */
    private static class ResetCodeData {
        final String code;
        final LocalDateTime expirationTime;
        
        ResetCodeData(String code, LocalDateTime expirationTime) {
            this.code = code;
            this.expirationTime = expirationTime;
        }
    }
}
