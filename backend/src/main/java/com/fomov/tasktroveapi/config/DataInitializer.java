package com.fomov.tasktroveapi.config;

import com.fomov.tasktroveapi.model.Account;
import com.fomov.tasktroveapi.model.Administrator;
import com.fomov.tasktroveapi.model.Role;
import com.fomov.tasktroveapi.repository.AccountRepository;
import com.fomov.tasktroveapi.repository.AdministratorRepository;
import com.fomov.tasktroveapi.service.RoleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleService roleService;
    private final AccountRepository accountRepository;
    private final AdministratorRepository administratorRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(RoleService roleService, 
                          AccountRepository accountRepository,
                          AdministratorRepository administratorRepository,
                          PasswordEncoder passwordEncoder) {
        this.roleService = roleService;
        this.accountRepository = accountRepository;
        this.administratorRepository = administratorRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        initializeRoles();
        initializeAdmin();
    }

    private void initializeRoles() {
        // Создаем базовые роли, если они не существуют
        createRoleIfNotExists("SuperAdministrator", "Super Administrator with full access");
        createRoleIfNotExists("Administrator", "System Administrator");
        createRoleIfNotExists("Customer", "Customer Role");
        createRoleIfNotExists("Performer", "Performer Role");
    }

    private void createRoleIfNotExists(String name, String description) {
        if (!roleService.existsByName(name)) {
            Role role = new Role(name, description);
            roleService.save(role);
            logger.info("Created role: {}", name);
        }
    }

    private void initializeAdmin() {
        // Проверяем, существует ли уже администратор с логином "admin" или email "admin@tasktrove.com"
        if (accountRepository.findByLogin("admin").isPresent() || 
            accountRepository.findByEmail("admin@tasktrove.com").isPresent()) {
            logger.info("Admin user already exists");
            return;
        }

        // Получаем роль SuperAdministrator
        Role superAdminRole = roleService.findByName("SuperAdministrator")
                .orElseThrow(() -> new RuntimeException("SuperAdministrator role not found. Please ensure roles are initialized first."));

        // Создаем аккаунт суперадминистратора
        Account adminAccount = new Account();
        adminAccount.setLogin("admin");
        adminAccount.setEmail("admin@tasktrove.com");
        adminAccount.setPassword(passwordEncoder.encode("admin"));
        adminAccount.setRole(superAdminRole);
        adminAccount.setIsActive(true);
        adminAccount = accountRepository.save(adminAccount);
        logger.info("Created super admin account with login: admin and role: SuperAdministrator");

        // Создаем сущность Administrator
        Administrator administrator = new Administrator();
        administrator.setAccount(adminAccount);
        administrator.setName("Administrator");
        administrator.setEmail("admin@tasktrove.com");
        administratorRepository.save(administrator);
        logger.info("Created administrator entity for super admin account");
    }
}
