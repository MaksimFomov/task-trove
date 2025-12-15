package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.model.Account;
import com.fomov.tasktroveapi.model.Notification;
import com.fomov.tasktroveapi.repository.AccountRepository;
import com.fomov.tasktroveapi.repository.NotificationRepository;
import com.fomov.tasktroveapi.service.NotificationService;
import com.fomov.tasktroveapi.exception.NotFoundException;
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
    private final AccountRepository accountRepository;

    public NotificationServiceImpl(NotificationRepository repository, AccountRepository accountRepository) {
        this.repository = repository;
        this.accountRepository = accountRepository;
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
        
        if (notification.getAccount() == null || !notification.getAccount().getId().equals(accountId)) {
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
        Account account = accountRepository.findById(customerAccountId)
                .orElseThrow(() -> new NotFoundException("Account", customerAccountId));
        Notification notification = new Notification(
            account,
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
        Account account = accountRepository.findById(performerAccountId)
                .orElseThrow(() -> new NotFoundException("Account", performerAccountId));
        Notification notification = new Notification(
            account,
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
        Account account = accountRepository.findById(customerAccountId)
                .orElseThrow(() -> new NotFoundException("Account", customerAccountId));
        Notification notification = new Notification(
            account,
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
    public void createOrderCompletedByCustomerNotification(Integer performerAccountId, Integer customerId, Integer orderId, String orderTitle, String customerName) {
        Account account = accountRepository.findById(performerAccountId)
                .orElseThrow(() -> new NotFoundException("Account", performerAccountId));
        Notification notification = new Notification(
            account,
            "Performer",
            "COMPLETED",
            "Заказ выполнен",
            String.format("Заказчик %s завершил заказ \"%s\"", customerName, orderTitle)
        );
        notification.setRelatedOrderId(orderId);
        notification.setRelatedCustomerId(customerId);
        save(notification);
        logger.info("Created COMPLETED notification for performer accountId={}, orderId={}", performerAccountId, orderId);
    }

    @Override
    public void createCorrectionNotification(Integer performerAccountId, Integer customerId, Integer orderId, String orderTitle, String customerName) {
        Account account = accountRepository.findById(performerAccountId)
                .orElseThrow(() -> new NotFoundException("Account", performerAccountId));
        Notification notification = new Notification(
            account,
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
        Account account = accountRepository.findById(customerAccountId)
                .orElseThrow(() -> new NotFoundException("Account", customerAccountId));
        Notification notification = new Notification(
            account,
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

    @Override
    public void createPerformerNotSelectedNotification(Integer performerAccountId, Integer customerId, Integer orderId, String orderTitle, String customerName) {
        Account account = accountRepository.findById(performerAccountId)
                .orElseThrow(() -> new NotFoundException("Account", performerAccountId));
        Notification notification = new Notification(
            account,
            "Performer",
            "REFUSED",
            "Вас не выбрали",
            String.format("Заказчик %s выбрал другого исполнителя для заказа \"%s\"", customerName, orderTitle)
        );
        notification.setRelatedOrderId(orderId);
        notification.setRelatedCustomerId(customerId);
        save(notification);
        logger.info("Created REFUSED notification for performer accountId={}, orderId={}", performerAccountId, orderId);
    }

    @Override
    public void createOrderReviewNotification(Integer adminAccountId, Integer customerId, Integer orderId, String orderTitle, String customerName) {
        Account account = accountRepository.findById(adminAccountId)
                .orElseThrow(() -> new NotFoundException("Account", adminAccountId));
        Notification notification = new Notification(
            account,
            "Administrator",
            "ORDER_REVIEW",
            "Новый заказ на рассмотрении",
            String.format("Заказчик %s создал заказ \"%s\", который требует проверки и одобрения", customerName, orderTitle)
        );
        notification.setRelatedOrderId(orderId);
        notification.setRelatedCustomerId(customerId);
        save(notification);
        logger.info("Created ORDER_REVIEW notification for admin accountId={}, orderId={}", adminAccountId, orderId);
    }

    @Override
    public void createOrderApprovedNotification(Integer customerAccountId, Integer orderId, String orderTitle) {
        Account account = accountRepository.findById(customerAccountId)
                .orElseThrow(() -> new NotFoundException("Account", customerAccountId));
        Notification notification = new Notification(
            account,
            "Customer",
            "ORDER_APPROVED",
            "Заказ одобрен",
            String.format("Ваш заказ \"%s\" был одобрен администратором и теперь доступен для исполнителей", orderTitle)
        );
        notification.setRelatedOrderId(orderId);
        save(notification);
        logger.info("Created ORDER_APPROVED notification for customer accountId={}, orderId={}", customerAccountId, orderId);
    }

    @Override
    public void createOrderRejectedNotification(Integer customerAccountId, Integer orderId, String orderTitle, String reason) {
        Account account = accountRepository.findById(customerAccountId)
                .orElseThrow(() -> new NotFoundException("Account", customerAccountId));
        String message = String.format("Ваш заказ \"%s\" не прошел проверку администратором", orderTitle);
        if (reason != null && !reason.trim().isEmpty()) {
            message += String.format(". Причина: %s", reason);
        }
        
        Notification notification = new Notification(
            account,
            "Customer",
            "ORDER_REJECTED",
            "Заказ не прошел проверку",
            message
        );
        notification.setRelatedOrderId(orderId);
        save(notification);
        logger.info("Created ORDER_REJECTED notification for customer accountId={}, orderId={}", customerAccountId, orderId);
    }
    
    @Override
    public void createReviewNotification(Integer performerAccountId, Integer customerId, Integer orderId, String orderTitle, String customerName, Integer mark) {
        Account account = accountRepository.findById(performerAccountId)
                .orElseThrow(() -> new NotFoundException("Account", performerAccountId));
        Notification notification = new Notification(
            account,
            "Performer",
            "REVIEW",
            "Вас оценили",
            String.format("Заказчик %s оставил вам отзыв с оценкой %d/5 по заказу \"%s\"", customerName, mark, orderTitle)
        );
        notification.setRelatedOrderId(orderId);
        notification.setRelatedCustomerId(customerId);
        save(notification);
        logger.info("Created REVIEW notification for performer accountId={}, orderId={}, mark={}", performerAccountId, orderId, mark);
    }
    
    @Override
    public void createCustomerReviewNotification(Integer customerAccountId, Integer performerId, Integer orderId, String orderTitle, String performerName, Integer mark) {
        Account account = accountRepository.findById(customerAccountId)
                .orElseThrow(() -> new NotFoundException("Account", customerAccountId));
        Notification notification = new Notification(
            account,
            "Customer",
            "REVIEW",
            "Вас оценили",
            String.format("Исполнитель %s оставил вам отзыв с оценкой %d/5 по заказу \"%s\"", performerName, mark, orderTitle)
        );
        notification.setRelatedOrderId(orderId);
        notification.setRelatedPerformerId(performerId);
        save(notification);
        logger.info("Created REVIEW notification for customer accountId={}, orderId={}, mark={}", customerAccountId, orderId, mark);
    }
}
