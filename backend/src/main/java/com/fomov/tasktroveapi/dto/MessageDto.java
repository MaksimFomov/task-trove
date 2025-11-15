package com.fomov.tasktroveapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;

public class MessageDto {
    private Integer id;
    
    @NotNull(message = "Chat ID is required")
    @JsonProperty("chatId")
    private Integer chatId;
    
    @NotNull(message = "Author user ID is required")
    @JsonProperty("authorUserId")
    private Integer authorUserId;
    
    @NotBlank(message = "Content is required")
    @JsonProperty("content")
    private String content;
    
    @NotBlank(message = "Text is required")
    @JsonProperty("text")
    private String text;
    
    @JsonProperty("fromWho")
    private String fromWho;
    
    @JsonProperty("sender")
    private String sender;
    
    @JsonProperty("sentAt")
    private OffsetDateTime sentAt;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getChatId() { return chatId; }
    public void setChatId(Integer chatId) { this.chatId = chatId; }
    public Integer getAuthorUserId() { return authorUserId; }
    public void setAuthorUserId(Integer authorUserId) { this.authorUserId = authorUserId; }
    public String getContent() { return content != null ? content : text; }
    public void setContent(String content) { this.content = content; }
    public String getText() { return text != null ? text : content; }
    public void setText(String text) { this.text = text; }
    public String getFromWho() { return fromWho; }
    public void setFromWho(String fromWho) { this.fromWho = fromWho; }
    public String getSender() { return sender != null ? sender : fromWho; }
    public void setSender(String sender) { this.sender = sender; }
    public OffsetDateTime getSentAt() { return sentAt; }
    public void setSentAt(OffsetDateTime sentAt) { this.sentAt = sentAt; }
}


