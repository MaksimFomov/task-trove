package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.model.Customer;
import com.fomov.tasktroveapi.model.Performer;
import com.fomov.tasktroveapi.service.EmailNotificationService;
import com.fomov.tasktroveapi.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class EmailNotificationServiceImpl implements EmailNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(EmailNotificationServiceImpl.class);
    
    private final EmailService emailService;

    public EmailNotificationServiceImpl(EmailService emailService) {
        this.emailService = emailService;
    }

    @Override
    public void sendCorrectionRequestEmail(String performerEmail, String emailText, String attachmentPath) {
        String subject = "Требуются правки по заказу";
        if (attachmentPath != null && !attachmentPath.isEmpty()) {
            emailService.sendEmailWithAttachment(performerEmail, subject, emailText, attachmentPath);
        } else {
            emailService.sendEmail(performerEmail, subject, emailText);
        }
        logger.info("Sent correction request email to: {}", performerEmail);
    }

    @Override
    public void sendPerformerApprovalEmail(String performerEmail, String emailText, String attachmentPath) {
        String subject = "Вас приняли в работу";
        if (attachmentPath != null && !attachmentPath.isEmpty()) {
            emailService.sendEmailWithAttachment(performerEmail, subject, emailText, attachmentPath);
        } else {
            emailService.sendEmail(performerEmail, subject, emailText);
        }
        logger.info("Sent performer approval email to: {}", performerEmail);
    }

    @Override
    public void sendPerformerRefusalEmail(Performer performer, String performerName, String customerName, String orderTitle) {
        if (performer == null || performer.getEmail() == null) {
            logger.warn("Cannot send refusal email: performer or email is null");
            return;
        }
        
        String subject = "Отказ от работы";
        String emailText = String.format(
            "Здравствуйте, %s!\n\n" +
            "Заказчик %s отказался от ваших услуг по заказу \"%s\".\n\n" +
            "С уважением,\nTaskTrove",
            performerName, customerName, orderTitle
        );
        
        emailService.sendEmail(performer.getEmail(), subject, emailText);
        logger.info("Sent performer refusal email to: {}", performer.getEmail());
    }

    @Override
    public void sendWorkCompletionEmail(Customer customer, String performerName, String orderTitle) {
        if (customer == null || customer.getEmail() == null) {
            logger.warn("Cannot send work completion email: customer or email is null");
            return;
        }
        
        String subject = "Работа завершена";
        String emailText = String.format(
            "Здравствуйте!\n\n" +
            "Исполнитель %s завершил работу по заказу \"%s\".\n" +
            "Пожалуйста, проверьте выполненную работу.\n\n" +
            "С уважением,\nTaskTrove",
            performerName, orderTitle
        );
        
        emailService.sendEmail(customer.getEmail(), subject, emailText);
        logger.info("Sent work completion email to: {}", customer.getEmail());
    }

    @Override
    public void sendCustomerRefusalEmail(Customer customer, String performerName, String orderTitle) {
        if (customer == null || customer.getEmail() == null) {
            logger.warn("Cannot send customer refusal email: customer or email is null");
            return;
        }
        
        String subject = "Исполнитель отказался от работы";
        String emailText = String.format(
            "Здравствуйте!\n\n" +
            "Исполнитель %s отказался от работы по заказу \"%s\".\n" +
            "Заказ снова доступен для других исполнителей.\n\n" +
            "С уважением,\nTaskTrove",
            performerName, orderTitle
        );
        
        emailService.sendEmail(customer.getEmail(), subject, emailText);
        logger.info("Sent customer refusal email to: {}", customer.getEmail());
    }
}

