package com.fomov.tasktroveapi.controller;

import com.fomov.tasktroveapi.model.Account;
import com.fomov.tasktroveapi.dto.AuthenticationAccDto;
import com.fomov.tasktroveapi.dto.RegistrationAccDto;
import com.fomov.tasktroveapi.dto.RegistrationCustDto;
import com.fomov.tasktroveapi.repository.AccountRepository;
import com.fomov.tasktroveapi.security.JwtTokenService;
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

    public AuthController(AccountRepository accountRepository,
                          JwtTokenService tokenService,
                          RegistrationService registrationService,
                          PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.tokenService = tokenService;
        this.registrationService = registrationService;
        this.passwordEncoder = passwordEncoder;
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
}


