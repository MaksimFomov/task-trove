package com.fomov.tasktroveapi.controller;

import com.fomov.tasktroveapi.model.Account;
import com.fomov.tasktroveapi.dto.AuthenticationAccDto;
import com.fomov.tasktroveapi.dto.RegistrationAccDto;
import com.fomov.tasktroveapi.dto.RegistrationCustDto;
import com.fomov.tasktroveapi.repository.AccountRepository;
import com.fomov.tasktroveapi.security.JwtTokenService;
import com.fomov.tasktroveapi.security.SecurityUtils;
import com.fomov.tasktroveapi.service.EmailVerificationService;
import com.fomov.tasktroveapi.service.PasswordResetService;
import com.fomov.tasktroveapi.service.RegistrationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AccountRepository accountRepository;
    private final JwtTokenService tokenService;
    private final RegistrationService registrationService;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService emailVerificationService;
    private final PasswordResetService passwordResetService;

    public AuthController(AccountRepository accountRepository,
                          JwtTokenService tokenService,
                          RegistrationService registrationService,
                          PasswordEncoder passwordEncoder,
                          EmailVerificationService emailVerificationService,
                          PasswordResetService passwordResetService) {
        this.accountRepository = accountRepository;
        this.tokenService = tokenService;
        this.registrationService = registrationService;
        this.passwordEncoder = passwordEncoder;
        this.emailVerificationService = emailVerificationService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/login")
    @Transactional(readOnly = true)
    public ResponseEntity<?> login(@RequestBody @Validated AuthenticationAccDto dto) {
        var accOpt = accountRepository.findByLoginWithRole(dto.getLogin());
        if (accOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Неправильный логин или пароль"));
        }
        Account acc = accOpt.get();
        if (!passwordEncoder.matches(dto.getPassword(), acc.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Неправильный логин или пароль"));
        }
        String roleName = acc.getRole() != null ? acc.getRole().getName() : "USER";
        String token = tokenService.createToken(acc.getId(), roleName, Map.of());
        return ResponseEntity.ok(Map.of(
                "id", acc.getId(),
                "login", acc.getLogin(),
                "role", roleName,
                "token", token
        ));
    }

    @PostMapping("/register/customer")
    public ResponseEntity<?> registerCustomer(@RequestBody @Validated RegistrationCustDto dto) {
        var customer = registrationService.registerCustomer(dto);
        Account account = customer.getAccount();
        String token = tokenService.createToken(account.getId(), account.getRole().getName(), Map.of());
        return ResponseEntity.ok(Map.of(
                "id", customer.getId(),
                "login", account.getLogin(),
                "role", account.getRole().getName(),
                "token", token
        ));
    }

    @PostMapping("/register/perf")
    public ResponseEntity<?> registerPerformer(@RequestBody @Validated RegistrationAccDto dto) {
        var performer = registrationService.registerPerformer(dto);
        Account account = performer.getAccount();
        String token = tokenService.createToken(account.getId(), account.getRole().getName(), Map.of());
        return ResponseEntity.ok(Map.of(
                "id", performer.getId(),
                "login", account.getLogin(),
                "role", account.getRole().getName(),
                "token", token
        ));
    }

    @GetMapping("/check-email")
    @Transactional(readOnly = true)
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email обязателен"));
        }
        // Нормализуем email для проверки
        String normalizedEmail = email.trim().toLowerCase();
        boolean exists = registrationService.emailExists(normalizedEmail);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @PostMapping("/send-verification")
    public ResponseEntity<?> sendVerification(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email обязателен"));
        }

        // Нормализуем email для проверки
        String normalizedEmail = email.trim().toLowerCase();
        
        // Проверяем, не занят ли email
        if (registrationService.emailExists(normalizedEmail)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Пользователь с таким email уже зарегистрирован"));
        }

        try {
            emailVerificationService.sendVerificationCode(normalizedEmail);
            return ResponseEntity.ok(Map.of("message", "Код подтверждения отправлен на вашу почту"));
        } catch (Exception e) {
            logger.error("Failed to send verification code", e);
            return ResponseEntity.status(500).body(Map.of("error", "Не удалось отправить код подтверждения"));
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email обязателен"));
        }
        if (code == null || code.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Код подтверждения обязателен"));
        }

        // Нормализуем email для проверки кода
        String normalizedEmail = email.trim().toLowerCase();
        String normalizedCode = code.trim();

        boolean isValid = emailVerificationService.verifyCode(normalizedEmail, normalizedCode);
        if (isValid) {
            // Удаляем код после успешной проверки
            emailVerificationService.removeCode(normalizedEmail);
            return ResponseEntity.ok(Map.of("message", "Email успешно подтвержден"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Неверный код подтверждения или код истек"));
        }
    }

    @PutMapping("/change-password")
    @Transactional
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");

        if (oldPassword == null || oldPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Текущий пароль обязателен"));
        }
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Новый пароль обязателен"));
        }
        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "Новый пароль должен содержать минимум 8 символов"));
        }

        Integer accountId = SecurityUtils.getCurrentUserId();
        if (accountId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Необходима авторизация"));
        }

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        // Проверяем текущий пароль
        if (!passwordEncoder.matches(oldPassword, account.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Неверный текущий пароль"));
        }

        // Обновляем пароль
        account.setPassword(passwordEncoder.encode(newPassword));
        accountRepository.save(account);

        logger.info("Password changed for account ID: {}", accountId);
        return ResponseEntity.ok(Map.of("message", "Пароль успешно изменен"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword() {
        Integer accountId = SecurityUtils.getCurrentUserId();
        if (accountId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Необходима авторизация"));
        }

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        String email = account.getEmail();
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email не найден в аккаунте"));
        }

        try {
            passwordResetService.sendPasswordResetCode(email);
            return ResponseEntity.ok(Map.of("message", "Код восстановления отправлен на вашу почту"));
        } catch (RuntimeException e) {
            logger.error("Failed to send password reset code", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error sending password reset code", e);
            return ResponseEntity.status(500).body(Map.of("error", "Не удалось отправить код восстановления"));
        }
    }

    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        Integer accountId = SecurityUtils.getCurrentUserId();
        if (accountId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Необходима авторизация"));
        }

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        String email = account.getEmail();
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email не найден в аккаунте"));
        }

        String code = request.get("code");
        String newPassword = request.get("newPassword");

        if (code == null || code.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Код восстановления обязателен"));
        }
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Новый пароль обязателен"));
        }
        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "Пароль должен содержать минимум 8 символов"));
        }

        try {
            passwordResetService.resetPassword(email, code.trim(), newPassword);
            return ResponseEntity.ok(Map.of("message", "Пароль успешно восстановлен"));
        } catch (RuntimeException e) {
            logger.error("Failed to reset password", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error resetting password", e);
            return ResponseEntity.status(500).body(Map.of("error", "Не удалось восстановить пароль"));
        }
    }

    // Публичные endpoints для восстановления пароля (без авторизации)
    @PostMapping("/forgot-password-public")
    public ResponseEntity<?> forgotPasswordPublic(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email обязателен"));
        }

        // Нормализуем email
        String normalizedEmail = email.trim().toLowerCase();

        // Проверяем, существует ли пользователь с таким email
        var accountOpt = accountRepository.findByEmail(normalizedEmail);
        if (accountOpt.isEmpty()) {
            // Не раскрываем, что пользователь не существует (безопасность)
            return ResponseEntity.ok(Map.of("message", "Если пользователь с таким email существует, код восстановления отправлен на почту"));
        }

        try {
            passwordResetService.sendPasswordResetCode(normalizedEmail);
            return ResponseEntity.ok(Map.of("message", "Если пользователь с таким email существует, код восстановления отправлен на почту"));
        } catch (RuntimeException e) {
            logger.error("Failed to send password reset code", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error sending password reset code", e);
            return ResponseEntity.status(500).body(Map.of("error", "Не удалось отправить код восстановления"));
        }
    }

    @PostMapping("/reset-password-public")
    @Transactional
    public ResponseEntity<?> resetPasswordPublic(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        String newPassword = request.get("newPassword");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email обязателен"));
        }
        if (code == null || code.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Код восстановления обязателен"));
        }
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Новый пароль обязателен"));
        }
        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "Пароль должен содержать минимум 8 символов"));
        }

        // Нормализуем email
        String normalizedEmail = email.trim().toLowerCase();

        try {
            passwordResetService.resetPassword(normalizedEmail, code.trim(), newPassword);
            return ResponseEntity.ok(Map.of("message", "Пароль успешно восстановлен"));
        } catch (RuntimeException e) {
            logger.error("Failed to reset password", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error resetting password", e);
            return ResponseEntity.status(500).body(Map.of("error", "Не удалось восстановить пароль"));
        }
    }
}


