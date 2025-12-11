package com.fomov.tasktroveapi.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateCustomerPortfolioDto {
    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;
    
    @Min(value = 18, message = "Age must be at least 18")
    private Integer age;
    
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;
    
    @NotBlank(message = "Scope is required")
    @Size(max = 255, message = "Scope must not exceed 255 characters")
    private String scopeS;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getScopeS() { return scopeS; }
    public void setScopeS(String scopeS) { this.scopeS = scopeS; }
}
