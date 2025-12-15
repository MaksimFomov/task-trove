package com.fomov.tasktroveapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public class UpdateReplyDto {
    @NotNull(message = "ID is required")
    @JsonProperty("id")
    private Integer id;
    
    // Флаг для завершения задачи исполнителем (устанавливает Order.status = ON_CHECK)
    @JsonProperty("isDoneThisTask")
    private Boolean isDoneThisTask;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Boolean getIsDoneThisTask() { return isDoneThisTask; }
    public void setIsDoneThisTask(Boolean isDoneThisTask) { this.isDoneThisTask = isDoneThisTask; }
}

