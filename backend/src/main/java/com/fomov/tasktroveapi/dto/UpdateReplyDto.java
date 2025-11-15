package com.fomov.tasktroveapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public class UpdateReplyDto {
    @NotNull(message = "ID is required")
    @JsonProperty("id")
    private Integer id;
    
    @JsonProperty("isDoneThisTask")
    private Boolean isDoneThisTask;
    
    @JsonProperty("isOnCustomer")
    private Boolean isOnCustomer;
    
    @JsonProperty("donned")
    private Boolean donned;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Boolean getIsDoneThisTask() { return isDoneThisTask; }
    public void setIsDoneThisTask(Boolean isDoneThisTask) { this.isDoneThisTask = isDoneThisTask; }

    public Boolean getIsOnCustomer() { return isOnCustomer; }
    public void setIsOnCustomer(Boolean isOnCustomer) { this.isOnCustomer = isOnCustomer; }

    public Boolean getDonned() { return donned; }
    public void setDonned(Boolean donned) { this.donned = donned; }
}

