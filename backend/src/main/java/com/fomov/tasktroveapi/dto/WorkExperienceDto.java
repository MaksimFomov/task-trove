package com.fomov.tasktroveapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class WorkExperienceDto {
    
    private Integer id;
    
    @NotBlank(message = "Name is required")
    private String name;
    
    @NotNull(message = "Rate is required")
    @Min(value = 1, message = "Rate must be at least 1")
    @Max(value = 5, message = "Rate must not exceed 5")
    @JsonProperty("mark")
    private Integer rate;
    
    @JsonProperty("text")
    private String text;
    
    @JsonProperty("orderId")
    private Integer orderId;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer customerId;
    
    @NotNull(message = "Performer ID is required")
    private Integer performerId;
    private String customerName;
    private String performerName;
}
