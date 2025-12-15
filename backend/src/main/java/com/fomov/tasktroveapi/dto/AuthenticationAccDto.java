package com.fomov.tasktroveapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class AuthenticationAccDto {
    @NotBlank
    @JsonProperty("login") // Оставляем для обратной совместимости, но используем как email
    private String login; // На самом деле это email
    
    @NotBlank
    @JsonProperty("password")
    private String password;

    public String getLogin() { return login; }
    public void setLogin(String login) { this.login = login; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    // Геттер для ясности - login теперь это email
    public String getEmail() { return login; }
}
