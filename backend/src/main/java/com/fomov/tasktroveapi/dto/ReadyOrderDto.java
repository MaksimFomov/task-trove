package com.fomov.tasktroveapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public class ReadyOrderDto {
    @NotNull(message = "Order ID is required")
    @JsonProperty("orderId")
    private Integer orderId;
    
    @JsonProperty("customerId")
    private Integer customerId; // Будет установлен из токена
    
    @JsonProperty("isDone")
    private Boolean isDone;
    
    @JsonProperty("isOnCheck")
    private Boolean isOnCheck;

    public Integer getOrderId() { return orderId; }
    public void setOrderId(Integer orderId) { this.orderId = orderId; }

    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }

    public Boolean getIsDone() { return isDone; }
    public void setIsDone(Boolean isDone) { this.isDone = isDone; }

    public Boolean getIsOnCheck() { return isOnCheck; }
    public void setIsOnCheck(Boolean isOnCheck) { this.isOnCheck = isOnCheck; }
}

