package com.fomov.tasktroveapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class RegistrationCustDto {
    @NotBlank
    @JsonProperty("name")
    private String name;
    
    @Email
    @NotBlank
    @JsonProperty("email")
    private String email;
    
    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @JsonProperty("passwordUser")
    private String passwordUser;
    
    @NotNull(message = "Age is required")
    @jakarta.validation.constraints.Min(value = 18, message = "Age must be at least 18")
    @jakarta.validation.constraints.Max(value = 120, message = "Age must not exceed 120")
    @JsonProperty("age")
    private Integer age;
    
    @NotBlank
    @JsonProperty("description")
    private String description;
    
    @NotBlank
    @JsonProperty("scopeS")
    private String scopeS;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordUser() { return passwordUser; }
    public void setPasswordUser(String passwordUser) { this.passwordUser = passwordUser; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getScopeS() { return scopeS; }
    public void setScopeS(String scopeS) { this.scopeS = scopeS; }
}
