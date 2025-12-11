package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.service.EmailService;
import com.fomov.tasktroveapi.service.EmailVerificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailVerificationServiceImpl implements EmailVerificationService {

    private static final Logger logger = LoggerFactory.getLogger(EmailVerificationServiceImpl.class);
    
    // Хранилище кодов: email -> {code, expirationTime}
    private final Map<String, VerificationCodeData> verificationCodes = new ConcurrentHashMap<>();
    
    // Время жизни кода в минутах
    private static final int CODE_EXPIRATION_MINUTES = 10;
    
    private final EmailService emailService;
    private final SecureRandom random = new SecureRandom();

    public EmailVerificationServiceImpl(EmailService emailService) {
        this.emailService = emailService;
    }

    @Override
    public void sendVerificationCode(String email) {
        // Генерируем 6-значный код
        String code = String.format("%06d", random.nextInt(1000000));
        
        // Сохраняем код с временем истечения
        LocalDateTime expirationTime = LocalDateTime.now().plusMinutes(CODE_EXPIRATION_MINUTES);
        verificationCodes.put(email, new VerificationCodeData(code, expirationTime));
        
        // Отправляем email
        String subject = "Код подтверждения email - TaskTrove";
        String text = String.format(
            "Здравствуйте!\n\n" +
            "Ваш код подтверждения email: %s\n\n" +
            "Код действителен в течение %d минут.\n\n" +
            "Если вы не запрашивали этот код, просто проигнорируйте это письмо.\n\n" +
            "С уважением,\n" +
            "Команда TaskTrove",
            code, CODE_EXPIRATION_MINUTES
        );
        
        try {
            emailService.sendEmail(email, subject, text);
            logger.info("Verification code sent to email: {}", email);
        } catch (Exception e) {
            logger.error("Failed to send verification code to email: {}", email, e);
            verificationCodes.remove(email);
            throw new RuntimeException("Не удалось отправить код подтверждения", e);
        }
    }

    @Override
    public boolean verifyCode(String email, String code) {
        VerificationCodeData data = verificationCodes.get(email);
        
        if (data == null) {
            logger.warn("No verification code found for email: {}", email);
            return false;
        }
        
        // Проверяем, не истек ли код
        if (LocalDateTime.now().isAfter(data.expirationTime)) {
            logger.warn("Verification code expired for email: {}", email);
            verificationCodes.remove(email);
            return false;
        }
        
        // Проверяем код
        boolean isValid = data.code.equals(code);
        if (isValid) {
            logger.info("Verification code verified successfully for email: {}", email);
        } else {
            logger.warn("Invalid verification code for email: {}", email);
        }
        
        return isValid;
    }

    @Override
    public void removeCode(String email) {
        verificationCodes.remove(email);
        logger.info("Verification code removed for email: {}", email);
    }
    
    /**
     * Периодическая очистка истекших кодов (каждые 5 минут)
     */
    @Scheduled(fixedRate = 300000) // 5 минут
    public void cleanupExpiredCodes() {
        LocalDateTime now = LocalDateTime.now();
        verificationCodes.entrySet().removeIf(entry -> 
            now.isAfter(entry.getValue().expirationTime)
        );
        logger.debug("Cleaned up expired verification codes");
    }
    
    /**
     * Внутренний класс для хранения данных кода подтверждения
     */
    private static class VerificationCodeData {
        final String code;
        final LocalDateTime expirationTime;
        
        VerificationCodeData(String code, LocalDateTime expirationTime) {
            this.code = code;
            this.expirationTime = expirationTime;
        }
    }
}
