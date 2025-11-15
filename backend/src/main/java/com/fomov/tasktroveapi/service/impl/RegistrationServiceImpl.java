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
    @Transactional
    public boolean emailExists(String email) {
        return accountRepository.findByEmail(email).isPresent() ||
               customerRepository.findByEmail(email).isPresent() ||
               performerRepository.findByEmail(email).isPresent();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Customer registerCustomer(RegistrationCustDto dto) {
        logger.info("Registering new customer with email: {}", dto.getEmail());
        
        // Проверяем email
        if (emailExists(dto.getEmail())) {
            throw new RepetitiveEmailException("Email already exists: " + dto.getEmail());
        }
        
        // Получаем роль Customer
        Role customerRole = roleRepository.findByName("Customer")
                .orElseThrow(() -> new RuntimeException("Role 'Customer' not found"));
        
        // Создаем Account
        Account account = new Account();
        account.setLogin(dto.getEmail());
        account.setEmail(dto.getEmail());
        account.setPassword(passwordEncoder.encode(dto.getPasswordUser()));
        account.setRole(customerRole);
        Account savedAccount = accountRepository.save(account);
        
        // Создаем Customer и связываем с Account
        Customer customer = customerMapper.toEntity(dto);
        customer.setAccount(savedAccount);
        Customer saved = customerService.save(customer);
        
        logger.info("Customer registered successfully with ID: {}", saved.getId());
        return saved;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Performer registerPerformer(RegistrationAccDto dto) {
        logger.info("Registering new performer with email: {}", dto.getEmail());
        
        // Проверяем email
        if (emailExists(dto.getEmail())) {
            throw new RepetitiveEmailException("Email already exists: " + dto.getEmail());
        }
        
        // Получаем роль Performer
        Role performerRole = roleRepository.findByName("Performer")
                .orElseThrow(() -> new RuntimeException("Role 'Performer' not found"));
        
        // Создаем Account
        Account account = new Account();
        account.setLogin(dto.getEmail());
        account.setEmail(dto.getEmail());
        account.setPassword(passwordEncoder.encode(dto.getPasswordUser()));
        account.setRole(performerRole);
        Account savedAccount = accountRepository.save(account);
        
        // Создаем Performer и связываем с Account
        Performer performer = performerMapper.toEntity(dto);
        performer.setAccount(savedAccount);
        Performer saved = performerService.save(performer);
        
        // Создаем Portfolio для исполнителя
        Portfolio portfolio = new Portfolio();
        portfolio.setPerformer(saved);
        portfolio.setName(dto.getName());
        portfolio.setEmail(dto.getEmail());
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

