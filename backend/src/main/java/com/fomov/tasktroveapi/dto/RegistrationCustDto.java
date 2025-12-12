package com.fomov.tasktroveapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class RegistrationCustDto {
    @NotBlank
    @Size(max = 50, message = "Last name must not exceed 50 characters")
    @JsonProperty("lastName")
    private String lastName;
    
    @NotBlank
    @Size(max = 50, message = "First name must not exceed 50 characters")
    @JsonProperty("firstName")
    private String firstName;
    
    @Size(max = 50, message = "Middle name must not exceed 50 characters")
    @JsonProperty("middleName")
    private String middleName;
    
    @Deprecated
    @JsonProperty("name")
    private String name; // Для обратной совместимости
    
    @Email
    @NotBlank
    @JsonProperty("email")
    private String email;
    
    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @JsonProperty("passwordUser")
    private String passwordUser;
    
    @JsonProperty("phone")
    private String phone;
    
    @NotBlank
    @JsonProperty("description")
    private String description;
    
    @NotBlank
    @JsonProperty("scopeS")
    private String scopeS;

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getMiddleName() { return middleName; }
    public void setMiddleName(String middleName) { this.middleName = middleName; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordUser() { return passwordUser; }
    public void setPasswordUser(String passwordUser) { this.passwordUser = passwordUser; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getScopeS() { return scopeS; }
    public void setScopeS(String scopeS) { this.scopeS = scopeS; }
}
