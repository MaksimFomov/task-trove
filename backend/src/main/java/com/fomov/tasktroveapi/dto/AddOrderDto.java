package com.fomov.tasktroveapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

public class AddOrderDto {
    private Integer id;
    
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    @JsonProperty("title")
    private String title;
    
    @NotBlank(message = "Description is required")
    @JsonProperty("description")
    private String description;
    
    @NotBlank(message = "Scope is required")
    @Size(max = 255, message = "Scope must not exceed 255 characters")
    @JsonProperty("scope")
    private String scope;
    
    @JsonProperty("stackS")
    private String stackS;
    private Integer customerId;
    private Integer performerId;
    
    @JsonProperty("status")
    private String status; // "ACTIVE", "IN_PROCESS", "ON_CHECK", "ON_REVIEW", "DONE", "REJECTED"
    
    // Deprecated: Use status field instead. Kept for backward compatibility
    @Deprecated
    @JsonProperty("isActived")
    private boolean isActived;
    @Deprecated
    @JsonProperty("isInProcess")
    private boolean isInProcess;
    @Deprecated
    @JsonProperty("isOnCheck")
    private boolean isOnCheck;
    @Deprecated
    @JsonProperty("isDone")
    private boolean isDone;
    @Deprecated
    @JsonProperty("isOnReview")
    private boolean isOnReview;
    @Deprecated
    @JsonProperty("isRejected")
    private boolean isRejected;
    @JsonProperty("publicationTime")
    private OffsetDateTime publicationTime;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    @JsonProperty("budget")
    private java.math.BigDecimal budget;
    @JsonProperty("isSpecSent")
    private Boolean isSpecSent;
    private Integer replyBind;
    private String custOfOrder;
    private Integer howReplies;
    
    // Дополнительные поля для фронтенда
    @JsonProperty("customerName")
    private String customerName;
    
    @JsonProperty("performerName")
    private String performerName;
    
    @JsonProperty("customerEmail")
    private String customerEmail;
    
    @JsonProperty("performerEmail")
    private String performerEmail;
    
    // Replies для фронтенда
    @JsonProperty("replies")
    private java.util.List<ReplyDto> replies;
    
    // Флаг, указывающий откликнулся ли текущий пользователь на заказ
    @JsonProperty("hasReplied")
    private Boolean hasReplied = false;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }
    public String getStackS() { return stackS; }
    public void setStackS(String stackS) { this.stackS = stackS; }
    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }
    public Integer getPerformerId() { return performerId; }
    public void setPerformerId(Integer performerId) { this.performerId = performerId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    // Deprecated methods for backward compatibility
    @Deprecated
    public boolean isActived() { 
        return "ACTIVE".equals(status) || isActived; 
    }
    @Deprecated
    public void setActived(boolean actived) { 
        isActived = actived;
        if (actived && status == null) status = "ACTIVE";
    }
    @Deprecated
    public boolean isInProcess() { 
        return "IN_PROCESS".equals(status) || isInProcess; 
    }
    @Deprecated
    public void setInProcess(boolean inProcess) { 
        isInProcess = inProcess;
        if (inProcess && status == null) status = "IN_PROCESS";
    }
    @Deprecated
    public boolean isOnCheck() { 
        return "ON_CHECK".equals(status) || isOnCheck; 
    }
    @Deprecated
    public void setOnCheck(boolean onCheck) { 
        isOnCheck = onCheck;
        if (onCheck && status == null) status = "ON_CHECK";
    }
    @Deprecated
    public boolean isDone() { 
        return "DONE".equals(status) || isDone; 
    }
    @Deprecated
    public void setDone(boolean done) { 
        isDone = done;
        if (done && status == null) status = "DONE";
    }
    @Deprecated
    public boolean isOnReview() { 
        return "ON_REVIEW".equals(status) || isOnReview; 
    }
    @Deprecated
    public void setOnReview(boolean onReview) { 
        isOnReview = onReview;
        if (onReview && status == null) status = "ON_REVIEW";
    }
    @Deprecated
    public boolean isRejected() { 
        return "REJECTED".equals(status) || isRejected; 
    }
    @Deprecated
    public void setRejected(boolean rejected) { 
        isRejected = rejected;
        if (rejected && status == null) status = "REJECTED";
    }
    public OffsetDateTime getPublicationTime() { return publicationTime; }
    public void setPublicationTime(OffsetDateTime publicationTime) { this.publicationTime = publicationTime; }
    public OffsetDateTime getStartTime() { return startTime; }
    public void setStartTime(OffsetDateTime startTime) { this.startTime = startTime; }
    public OffsetDateTime getEndTime() { return endTime; }
    public void setEndTime(OffsetDateTime endTime) { this.endTime = endTime; }
    public java.math.BigDecimal getBudget() { return budget; }
    public void setBudget(java.math.BigDecimal budget) { this.budget = budget; }
    public Boolean getIsSpecSent() { return isSpecSent; }
    public void setIsSpecSent(Boolean isSpecSent) { this.isSpecSent = isSpecSent; }
    public Integer getReplyBind() { return replyBind; }
    public void setReplyBind(Integer replyBind) { this.replyBind = replyBind; }
    public String getCustOfOrder() { return custOfOrder; }
    public void setCustOfOrder(String custOfOrder) { this.custOfOrder = custOfOrder; }
    public Integer getHowReplies() { return howReplies; }
    public void setHowReplies(Integer howReplies) { this.howReplies = howReplies; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getPerformerName() { return performerName; }
    public void setPerformerName(String performerName) { this.performerName = performerName; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    public String getPerformerEmail() { return performerEmail; }
    public void setPerformerEmail(String performerEmail) { this.performerEmail = performerEmail; }
    public java.util.List<ReplyDto> getReplies() { return replies; }
    public void setReplies(java.util.List<ReplyDto> replies) { this.replies = replies; }
    public Boolean getHasReplied() { return hasReplied; }
    public void setHasReplied(Boolean hasReplied) { this.hasReplied = hasReplied; }
}
