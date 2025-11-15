package com.fomov.tasktroveapi.config;

import com.fomov.tasktroveapi.model.Role;
import com.fomov.tasktroveapi.service.RoleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleService roleService;

    public DataInitializer(RoleService roleService) {
        this.roleService = roleService;
    }

    @Override
    public void run(String... args) throws Exception {
        initializeRoles();
    }

    private void initializeRoles() {
        // Создаем базовые роли, если они не существуют
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
}
