package com.fomov.tasktroveapi.dto;

import java.time.OffsetDateTime;

public class NotificationDto {
    private Integer id;
    private Integer accountId;
    private String userRole;
    private String type;
    private String title;
    private String message;
    private Boolean isRead;
    private OffsetDateTime createdAt;
    private Integer relatedOrderId;
    private Integer relatedPerformerId;
    private Integer relatedCustomerId;

    public NotificationDto() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }
    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public Integer getRelatedOrderId() { return relatedOrderId; }
    public void setRelatedOrderId(Integer relatedOrderId) { this.relatedOrderId = relatedOrderId; }
    public Integer getRelatedPerformerId() { return relatedPerformerId; }
    public void setRelatedPerformerId(Integer relatedPerformerId) { this.relatedPerformerId = relatedPerformerId; }
    public Integer getRelatedCustomerId() { return relatedCustomerId; }
    public void setRelatedCustomerId(Integer relatedCustomerId) { this.relatedCustomerId = relatedCustomerId; }
}

