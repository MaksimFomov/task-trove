package com.fomov.tasktroveapi.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableJpaRepositories(basePackages = "com.fomov.tasktroveapi.repository")
@EnableTransactionManagement
public class DatabaseConfig {
    
    // Дополнительная конфигурация базы данных может быть добавлена здесь
    // Например, настройки Hibernate, кеширования и т.д.
}
