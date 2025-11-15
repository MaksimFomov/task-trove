package com.fomov.tasktroveapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class RegistrationAccDto {
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
    
    @JsonProperty("phone")
    private String phone;
    
    @JsonProperty("townCountry")
    private String townCountry;
    
    @JsonProperty("specializations")
    private String specializations;
    
    @JsonProperty("employment")
    private String employment;
    
    @JsonProperty("experience")
    private String experience;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordUser() { return passwordUser; }
    public void setPasswordUser(String passwordUser) { this.passwordUser = passwordUser; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getTownCountry() { return townCountry; }
    public void setTownCountry(String townCountry) { this.townCountry = townCountry; }
    public String getSpecializations() { return specializations; }
    public void setSpecializations(String specializations) { this.specializations = specializations; }
    public String getEmployment() { return employment; }
    public void setEmployment(String employment) { this.employment = employment; }
    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }
}
