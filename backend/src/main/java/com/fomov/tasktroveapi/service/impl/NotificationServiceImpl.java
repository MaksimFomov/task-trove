package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.model.Notification;
import com.fomov.tasktroveapi.repository.NotificationRepository;
import com.fomov.tasktroveapi.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationServiceImpl.class);
    
    private final NotificationRepository repository;

    public NotificationServiceImpl(NotificationRepository repository) {
        this.repository = repository;
    }

    @Override
    public Notification save(Notification notification) {
        return repository.save(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> findByAccountId(Integer accountId) {
        return repository.findByAccountIdOrderByCreatedAtDesc(accountId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> findUnreadByAccountId(Integer accountId) {
        return repository.findByAccountIdAndIsReadOrderByCreatedAtDesc(accountId, false);
    }

    @Override
    @Transactional(readOnly = true)
    public Long countUnreadByAccountId(Integer accountId) {
        return repository.countUnreadByAccountId(accountId);
    }

    @Override
    public void markAsRead(Integer notificationId, Integer accountId) {
        Notification notification = repository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));
        
        if (!notification.getAccountId().equals(accountId)) {
            throw new SecurityException("Access denied to notification " + notificationId);
        }
        
        notification.setIsRead(true);
        repository.save(notification);
    }

    @Override
    public void markAllAsRead(Integer accountId) {
        List<Notification> unreadNotifications = repository.findByAccountIdAndIsReadOrderByCreatedAtDesc(accountId, false);
        unreadNotifications.forEach(n -> n.setIsRead(true));
        repository.saveAll(unreadNotifications);
    }

    @Override
    public void deleteAllByAccountId(Integer accountId) {
        List<Notification> notifications = repository.findByAccountIdOrderByCreatedAtDesc(accountId);
        repository.deleteAll(notifications);
        logger.info("Deleted all notifications for accountId={}, count={}", accountId, notifications.size());
    }

    @Override
    public void createReplyNotification(Integer customerAccountId, Integer performerId, Integer orderId, String orderTitle, String performerName) {
        Notification notification = new Notification(
            customerAccountId,
            "Customer",
            "REPLY",
            "Новый отклик на заказ",
            String.format("Исполнитель %s откликнулся на ваш заказ \"%s\"", performerName, orderTitle)
        );
        notification.setRelatedOrderId(orderId);
        notification.setRelatedPerformerId(performerId);
        save(notification);
        logger.info("Created REPLY notification for customer accountId={}, orderId={}", customerAccountId, orderId);
    }

    @Override
    public void createAssignedNotification(Integer performerAccountId, Integer customerId, Integer orderId, String orderTitle, String customerName) {
        Notification notification = new Notification(
            performerAccountId,
            "Performer",
            "ASSIGNED",
            "Вас приняли в работу",
            String.format("Заказчик %s принял вас в работу по заказу \"%s\"", customerName, orderTitle)
        );
        notification.setRelatedOrderId(orderId);
        notification.setRelatedCustomerId(customerId);
        save(notification);
        logger.info("Created ASSIGNED notification for performer accountId={}, orderId={}", performerAccountId, orderId);
    }

    @Override
    public void createCompletedNotification(Integer customerAccountId, Integer performerId, Integer orderId, String orderTitle, String performerName) {
        Notification notification = new Notification(
            customerAccountId,
            "Customer",
            "COMPLETED",
            "Заказ завершен",
            String.format("Исполнитель %s завершил работу по заказу \"%s\"", performerName, orderTitle)
        );
        notification.setRelatedOrderId(orderId);
        notification.setRelatedPerformerId(performerId);
        save(notification);
        logger.info("Created COMPLETED notification for customer accountId={}, orderId={}", customerAccountId, orderId);
    }

    @Override
    public void createCorrectionNotification(Integer performerAccountId, Integer customerId, Integer orderId, String orderTitle, String customerName) {
        Notification notification = new Notification(
            performerAccountId,
            "Performer",
            "CORRECTION",
            "Требуются правки",
            String.format("Заказчик %s запросил правки по заказу \"%s\"", customerName, orderTitle)
        );
        notification.setRelatedOrderId(orderId);
        notification.setRelatedCustomerId(customerId);
        save(notification);
        logger.info("Created CORRECTION notification for performer accountId={}, orderId={}", performerAccountId, orderId);
    }

    @Override
    public void createRefusedNotification(Integer customerAccountId, Integer performerId, Integer orderId, String orderTitle, String performerName) {
        Notification notification = new Notification(
            customerAccountId,
            "Customer",
            "REFUSED",
            "Исполнитель отказался",
            String.format("Исполнитель %s отказался от работы по заказу \"%s\"", performerName, orderTitle)
        );
        notification.setRelatedOrderId(orderId);
        notification.setRelatedPerformerId(performerId);
        save(notification);
        logger.info("Created REFUSED notification for customer accountId={}, orderId={}", customerAccountId, orderId);
    }

    @Override
    public void createPerformerRefusedNotification(Integer customerAccountId, Integer performerId, Integer orderId, String orderTitle, String performerName) {
        // Это уведомление для заказчика, когда исполнитель отказывается от работы
        createRefusedNotification(customerAccountId, performerId, orderId, orderTitle, performerName);
    }
}
