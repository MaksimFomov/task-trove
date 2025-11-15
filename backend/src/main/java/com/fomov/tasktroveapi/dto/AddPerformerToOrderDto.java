package com.fomov.tasktroveapi.dto;

import jakarta.validation.constraints.NotNull;

public class AddPerformerToOrderDto {
    @NotNull(message = "Order ID is required")
    private Integer orderId;
    
    @NotNull(message = "Performer ID is required")
    private Integer performerId;
    
    private Integer customerId; // Будет установлен из токена

    public Integer getOrderId() { return orderId; }
    public void setOrderId(Integer orderId) { this.orderId = orderId; }

    public Integer getPerformerId() { return performerId; }
    public void setPerformerId(Integer performerId) { this.performerId = performerId; }

    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }
}

