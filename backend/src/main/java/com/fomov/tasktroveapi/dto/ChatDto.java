package com.fomov.tasktroveapi.dto;

public class ChatDto {
    private Integer id;
    private String roomName;
    private Integer customerId;
    private Integer performerId;
    private String customerName;
    private String performerName;
    private String orderTitle;

    public ChatDto() {}

    public ChatDto(Integer id, String roomName, Integer customerId, Integer performerId) {
        this.id = id;
        this.roomName = roomName;
        this.customerId = customerId;
        this.performerId = performerId;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }
    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }
    public Integer getPerformerId() { return performerId; }
    public void setPerformerId(Integer performerId) { this.performerId = performerId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getPerformerName() { return performerName; }
    public void setPerformerName(String performerName) { this.performerName = performerName; }
    public String getOrderTitle() { return orderTitle; }
    public void setOrderTitle(String orderTitle) { this.orderTitle = orderTitle; }
}


