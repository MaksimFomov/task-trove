package com.fomov.tasktroveapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ReplyDto {
    private Integer id;
    
    @NotBlank(message = "Order name is required")
    @JsonProperty("orderName")
    private String orderName;
    
    @NotNull(message = "Order ID is required")
    @JsonProperty("orderId")
    private Integer orderId;
    
    @JsonProperty("performerId")
    private Integer performerId;
    
    @JsonProperty("isDoneThisTask")
    private Boolean isDoneThisTask = false;
    
    @JsonProperty("isOnCustomer")
    private Boolean isOnCustomer = false;
    
    @JsonProperty("donned")
    private Boolean donned = false;
    
    @JsonProperty("workBind")
    private Integer workBind = 0;
    
    // Дополнительные поля для фронтенда
    @JsonProperty("orderNameByOrder")
    private String orderNameByOrder;
    
    @JsonProperty("orderDescription")
    private String orderDescription;
    
    @JsonProperty("orderScope")
    private String orderScope;
    
    @JsonProperty("orderStackS")
    private String orderStackS;
    
    @JsonProperty("orderPublicationTime")
    private String orderPublicationTime;
    
    @JsonProperty("orderHowReplies")
    private Integer orderHowReplies;
    
    @JsonProperty("perfName")
    private String perfName;

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getOrderName() { return orderName; }
    public void setOrderName(String orderName) { this.orderName = orderName; }

    public Integer getOrderId() { return orderId; }
    public void setOrderId(Integer orderId) { this.orderId = orderId; }

    public Integer getPerformerId() { return performerId; }
    public void setPerformerId(Integer performerId) { this.performerId = performerId; }

    public Boolean getIsDoneThisTask() { return isDoneThisTask; }
    public void setIsDoneThisTask(Boolean isDoneThisTask) { this.isDoneThisTask = isDoneThisTask; }

    public Boolean getIsOnCustomer() { return isOnCustomer; }
    public void setIsOnCustomer(Boolean isOnCustomer) { this.isOnCustomer = isOnCustomer; }

    public Boolean getDonned() { return donned; }
    public void setDonned(Boolean donned) { this.donned = donned; }

    public Integer getWorkBind() { return workBind; }
    public void setWorkBind(Integer workBind) { this.workBind = workBind; }
    public String getOrderNameByOrder() { return orderNameByOrder != null ? orderNameByOrder : orderName; }
    public void setOrderNameByOrder(String orderNameByOrder) { this.orderNameByOrder = orderNameByOrder; }
    public String getOrderDescription() { return orderDescription; }
    public void setOrderDescription(String orderDescription) { this.orderDescription = orderDescription; }
    public String getOrderScope() { return orderScope; }
    public void setOrderScope(String orderScope) { this.orderScope = orderScope; }
    public String getOrderStackS() { return orderStackS; }
    public void setOrderStackS(String orderStackS) { this.orderStackS = orderStackS; }
    public String getOrderPublicationTime() { return orderPublicationTime; }
    public void setOrderPublicationTime(String orderPublicationTime) { this.orderPublicationTime = orderPublicationTime; }
    public Integer getOrderHowReplies() { return orderHowReplies; }
    public void setOrderHowReplies(Integer orderHowReplies) { this.orderHowReplies = orderHowReplies; }
    public String getPerfName() { return perfName; }
    public void setPerfName(String perfName) { this.perfName = perfName; }
}

