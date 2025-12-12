package com.fomov.tasktroveapi.service;

import com.fomov.tasktroveapi.model.Notification;

import java.util.List;

public interface NotificationService {
    Notification save(Notification notification);
    List<Notification> findByAccountId(Integer accountId);
    List<Notification> findUnreadByAccountId(Integer accountId);
    Long countUnreadByAccountId(Integer accountId);
    void markAsRead(Integer notificationId, Integer accountId);
    void markAllAsRead(Integer accountId);
    void deleteAllByAccountId(Integer accountId);
    
    // Методы для создания уведомлений при различных событиях
    void createReplyNotification(Integer customerAccountId, Integer performerId, Integer orderId, String orderTitle, String performerName);
    void createAssignedNotification(Integer performerAccountId, Integer customerId, Integer orderId, String orderTitle, String customerName);
    void createCompletedNotification(Integer customerAccountId, Integer performerId, Integer orderId, String orderTitle, String performerName);
    void createCorrectionNotification(Integer performerAccountId, Integer customerId, Integer orderId, String orderTitle, String customerName);
    void createRefusedNotification(Integer customerAccountId, Integer performerId, Integer orderId, String orderTitle, String performerName);
    void createPerformerRefusedNotification(Integer customerAccountId, Integer performerId, Integer orderId, String orderTitle, String performerName);
    
    // Методы для уведомлений о модерации заказов
    void createOrderReviewNotification(Integer adminAccountId, Integer customerId, Integer orderId, String orderTitle, String customerName);
    void createOrderApprovedNotification(Integer customerAccountId, Integer orderId, String orderTitle);
    void createOrderRejectedNotification(Integer customerAccountId, Integer orderId, String orderTitle, String reason);
}
