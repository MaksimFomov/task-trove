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
    @JsonProperty("isActived")
    private boolean isActived;
    @JsonProperty("isInProcess")
    private boolean isInProcess;
    @JsonProperty("isOnCheck")
    private boolean isOnCheck;
    @JsonProperty("isDone")
    private boolean isDone;
    @JsonProperty("publicationTime")
    private OffsetDateTime publicationTime;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private String documentName;
    private String resultLink;
    private Integer replyBind;
    private String custOfOrder;
    private Integer howReplies;
    
    // Дополнительные поля для фронтенда
    @JsonProperty("customerName")
    private String customerName;
    
    @JsonProperty("performerName")
    private String performerName;
    
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
    public boolean isActived() { return isActived; }
    public void setActived(boolean actived) { isActived = actived; }
    public boolean isInProcess() { return isInProcess; }
    public void setInProcess(boolean inProcess) { isInProcess = inProcess; }
    public boolean isOnCheck() { return isOnCheck; }
    public void setOnCheck(boolean onCheck) { isOnCheck = onCheck; }
    public boolean isDone() { return isDone; }
    public void setDone(boolean done) { isDone = done; }
    public OffsetDateTime getPublicationTime() { return publicationTime; }
    public void setPublicationTime(OffsetDateTime publicationTime) { this.publicationTime = publicationTime; }
    public OffsetDateTime getStartTime() { return startTime; }
    public void setStartTime(OffsetDateTime startTime) { this.startTime = startTime; }
    public OffsetDateTime getEndTime() { return endTime; }
    public void setEndTime(OffsetDateTime endTime) { this.endTime = endTime; }
    public String getDocumentName() { return documentName; }
    public void setDocumentName(String documentName) { this.documentName = documentName; }
    public String getResultLink() { return resultLink; }
    public void setResultLink(String resultLink) { this.resultLink = resultLink; }
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
    public java.util.List<ReplyDto> getReplies() { return replies; }
    public void setReplies(java.util.List<ReplyDto> replies) { this.replies = replies; }
    public Boolean getHasReplied() { return hasReplied; }
    public void setHasReplied(Boolean hasReplied) { this.hasReplied = hasReplied; }
}
