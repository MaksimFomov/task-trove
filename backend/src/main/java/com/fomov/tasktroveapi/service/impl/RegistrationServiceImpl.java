package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.dto.RegistrationAccDto;
import com.fomov.tasktroveapi.dto.RegistrationCustDto;
import com.fomov.tasktroveapi.exception.RepetitiveEmailException;
import com.fomov.tasktroveapi.mapper.CustomerMapper;
import com.fomov.tasktroveapi.mapper.PerformerMapper;
import com.fomov.tasktroveapi.model.*;
import com.fomov.tasktroveapi.repository.AccountRepository;
import com.fomov.tasktroveapi.repository.CustomerRepository;
import com.fomov.tasktroveapi.repository.PerformerRepository;
import com.fomov.tasktroveapi.repository.RoleRepository;
import com.fomov.tasktroveapi.service.CustomerService;
import com.fomov.tasktroveapi.service.PerformerService;
import com.fomov.tasktroveapi.service.PortfolioService;
import com.fomov.tasktroveapi.service.RegistrationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegistrationServiceImpl implements RegistrationService {

    private static final Logger logger = LoggerFactory.getLogger(RegistrationServiceImpl.class);

    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final PerformerRepository performerRepository;
    private final RoleRepository roleRepository;
    private final CustomerService customerService;
    private final PerformerService performerService;
    private final PortfolioService portfolioService;
    private final CustomerMapper customerMapper;
    private final PerformerMapper performerMapper;
    private final PasswordEncoder passwordEncoder;

    public RegistrationServiceImpl(AccountRepository accountRepository,
                                   CustomerRepository customerRepository,
                                   PerformerRepository performerRepository,
                                   RoleRepository roleRepository,
                                   CustomerService customerService,
                                   PerformerService performerService,
                                   PortfolioService portfolioService,
                                   CustomerMapper customerMapper,
                                   PerformerMapper performerMapper,
                                   PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.performerRepository = performerRepository;
        this.roleRepository = roleRepository;
        this.customerService = customerService;
        this.performerService = performerService;
        this.portfolioService = portfolioService;
        this.customerMapper = customerMapper;
        this.performerMapper = performerMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean emailExists(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        // Нормализуем email: trim и lowercase для консистентности
        String normalizedEmail = email.trim().toLowerCase();
        // Проверяем email в Account, так как email уникален в таблице accounts
        // и Customer/Performer всегда связаны с Account через OneToOne
        // Это более эффективно, чем проверять все три репозитория
        return accountRepository.findByEmail(normalizedEmail).isPresent();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Customer registerCustomer(RegistrationCustDto dto) {
        // Нормализуем email
        String normalizedEmail = dto.getEmail() != null ? dto.getEmail().trim().toLowerCase() : null;
        logger.info("Registering new customer with email: {}, phone: {}, description: {}, scopeS: {}", 
            normalizedEmail, dto.getPhone(), dto.getDescription(), dto.getScopeS());
        
        // Проверяем email
        if (emailExists(normalizedEmail)) {
            throw new RepetitiveEmailException("Email already exists: " + normalizedEmail);
        }
        
        // Получаем роль Customer
        Role customerRole = roleRepository.findByName("Customer")
                .orElseThrow(() -> new RuntimeException("Role 'Customer' not found"));
        
        // Создаем Account
        Account account = new Account();
        account.setEmail(normalizedEmail);
        account.setPassword(passwordEncoder.encode(dto.getPasswordUser()));
        account.setRole(customerRole);
        account.setIsActive(true);
        Account savedAccount = accountRepository.save(account);
        
        // Создаем Customer и связываем с Account
        Customer customer = customerMapper.toEntity(dto);
        customer.setAccount(savedAccount);
        Customer saved = customerService.save(customer);
        
        // Создаем Portfolio для заказчика
        Portfolio portfolio = new Portfolio();
        portfolio.setCustomer(saved);
        portfolio.setOwnerType("CUSTOMER");
        // Формируем имя из ФИО для Portfolio
        StringBuilder fullName = new StringBuilder();
        if (dto.getLastName() != null && !dto.getLastName().trim().isEmpty()) {
            fullName.append(dto.getLastName().trim());
        }
        if (dto.getFirstName() != null && !dto.getFirstName().trim().isEmpty()) {
            if (fullName.length() > 0) fullName.append(" ");
            fullName.append(dto.getFirstName().trim());
        }
        if (dto.getMiddleName() != null && !dto.getMiddleName().trim().isEmpty()) {
            if (fullName.length() > 0) fullName.append(" ");
            fullName.append(dto.getMiddleName().trim());
        }
        portfolio.setName(fullName.length() > 0 ? fullName.toString() : "");
        portfolio.setEmail(normalizedEmail);
        // Устанавливаем phone, description и scopeS из DTO напрямую (без проверки на пустую строку для обязательных полей)
        portfolio.setPhone(dto.getPhone());
        portfolio.setDescription(dto.getDescription());
        portfolio.setScopeS(dto.getScopeS());
        portfolio.setIsActive(false);
        
        logger.info("Creating portfolio for customer ID: {}, phone: {}, description: {}, scopeS: {}", 
            saved.getId(), portfolio.getPhone(), portfolio.getDescription(), portfolio.getScopeS());
        
        Portfolio savedPortfolio = portfolioService.save(portfolio);
        logger.info("Portfolio created successfully with ID: {}", savedPortfolio.getId());
        
        logger.info("Customer registered successfully with ID: {}", saved.getId());
        return saved;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Performer registerPerformer(RegistrationAccDto dto) {
        // Нормализуем email
        String normalizedEmail = dto.getEmail() != null ? dto.getEmail().trim().toLowerCase() : null;
        logger.info("Registering new performer with email: {}", normalizedEmail);
        
        // Проверяем email
        if (emailExists(normalizedEmail)) {
            throw new RepetitiveEmailException("Email already exists: " + normalizedEmail);
        }
        
        // Получаем роль Performer
        Role performerRole = roleRepository.findByName("Performer")
                .orElseThrow(() -> new RuntimeException("Role 'Performer' not found"));
        
        // Создаем Account
        Account account = new Account();
        account.setEmail(normalizedEmail);
        account.setPassword(passwordEncoder.encode(dto.getPasswordUser()));
        account.setRole(performerRole);
        account.setIsActive(true);
        Account savedAccount = accountRepository.save(account);
        
        // Создаем Performer и связываем с Account
        Performer performer = performerMapper.toEntity(dto);
        performer.setAccount(savedAccount);
        Performer saved = performerService.save(performer);
        
        // Создаем Portfolio для исполнителя
        Portfolio portfolio = new Portfolio();
        portfolio.setPerformer(saved);
        portfolio.setOwnerType("PERFORMER");
        // Формируем имя из ФИО для Portfolio
        StringBuilder fullName = new StringBuilder();
        if (dto.getLastName() != null && !dto.getLastName().trim().isEmpty()) {
            fullName.append(dto.getLastName().trim());
        }
        if (dto.getFirstName() != null && !dto.getFirstName().trim().isEmpty()) {
            if (fullName.length() > 0) fullName.append(" ");
            fullName.append(dto.getFirstName().trim());
        }
        if (dto.getMiddleName() != null && !dto.getMiddleName().trim().isEmpty()) {
            if (fullName.length() > 0) fullName.append(" ");
            fullName.append(dto.getMiddleName().trim());
        }
        portfolio.setName(fullName.length() > 0 ? fullName.toString() : "");
        portfolio.setEmail(normalizedEmail);
        portfolio.setPhone(dto.getPhone());
        portfolio.setTownCountry(dto.getTownCountry());
        portfolio.setSpecializations(dto.getSpecializations());
        portfolio.setEmployment(dto.getEmployment());
        portfolio.setExperience(dto.getExperience());
        portfolio.setIsActive(false);
        portfolioService.save(portfolio);
        
        logger.info("Performer registered successfully with ID: {}", saved.getId());
        return saved;
    }
}

