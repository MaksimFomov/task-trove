package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.model.Customer;
import com.fomov.tasktroveapi.model.Performer;
import com.fomov.tasktroveapi.service.EmailService;
import com.fomov.tasktroveapi.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final EmailService emailService;

    public NotificationServiceImpl(EmailService emailService) {
        this.emailService = emailService;
    }

    @Override
    public void sendPerformerApprovalEmail(String performerEmail, String emailText, String attachmentPath) {
        try {
            String emailSubject = "Вас утвердили в TaskTrove";
            
            if (attachmentPath != null) {
                emailService.sendEmailWithAttachment(performerEmail, emailSubject, emailText, attachmentPath);
            } else {
                emailService.sendEmail(performerEmail, emailSubject, emailText);
            }
            logger.info("Approval email sent to performer: {}", performerEmail);
        } catch (Exception e) {
            logger.error("Failed to send approval email to performer: {}", performerEmail, e);
            throw new RuntimeException("Failed to send approval email: " + e.getMessage(), e);
        }
    }

    @Override
    public void sendCorrectionRequestEmail(String performerEmail, String emailText, String attachmentPath) {
        try {
            String emailSubject = "Требуются исправления - TaskTrove";
            
            if (attachmentPath != null) {
                emailService.sendEmailWithAttachment(performerEmail, emailSubject, emailText, attachmentPath);
            } else {
                emailService.sendEmail(performerEmail, emailSubject, emailText);
            }
            logger.info("Correction request email sent to performer: {}", performerEmail);
        } catch (Exception e) {
            logger.error("Failed to send correction request email to performer: {}", performerEmail, e);
            throw new RuntimeException("Failed to send correction request email: " + e.getMessage(), e);
        }
    }

    @Override
    public void sendPerformerRefusalEmail(Performer performer, String performerName, 
                                         String customerName, String orderTitle) {
        if (performer != null && performer.getAccount() != null) {
            try {
                String performerEmail = performer.getAccount().getEmail();
                String emailSubject = "Заказчик отказался от ваших услуг - TaskTrove";
                String emailText = String.format(
                    "Здравствуйте, %s!\n\n" +
                    "Заказчик %s отказался от ваших услуг по заказу \"%s\".\n\n" +
                    "Заказ снова доступен для других исполнителей.\n\n" +
                    "С уважением,\n" +
                    "Команда TaskTrove",
                    performerName,
                    customerName,
                    orderTitle
                );
                
                emailService.sendEmail(performerEmail, emailSubject, emailText);
                logger.info("Refusal email sent to performer: {}", performerEmail);
            } catch (Exception e) {
                logger.error("Failed to send refusal email to performer: {}", e.getMessage(), e);
            }
        }
    }

    @Override
    public void sendCustomerRefusalEmail(Customer customer, String performerName, String orderTitle) {
        if (customer != null && customer.getAccount() != null) {
            try {
                String customerEmail = customer.getAccount().getEmail();
                String emailSubject = "Исполнитель отказался от заказа - TaskTrove";
                String emailText = String.format(
                    "Здравствуйте, %s!\n\n" +
                    "Исполнитель %s отказался от выполнения вашего заказа \"%s\".\n\n" +
                    "Заказ снова доступен для поиска нового исполнителя.\n\n" +
                    "С уважением,\n" +
                    "Команда TaskTrove",
                    customer.getName() != null ? customer.getName() : "Уважаемый заказчик",
                    performerName,
                    orderTitle
                );
                
                emailService.sendEmail(customerEmail, emailSubject, emailText);
                logger.info("Refusal email sent to customer: {}", customerEmail);
            } catch (Exception e) {
                logger.error("Failed to send refusal email to customer: {}", e.getMessage(), e);
            }
        }
    }

    @Override
    public void sendWorkCompletionEmail(Customer customer, String performerName, String orderTitle) {
        if (customer != null && customer.getAccount() != null) {
            try {
                String customerEmail = customer.getAccount().getEmail();
                String emailSubject = "Работа по заказу завершена - TaskTrove";
                String emailText = String.format(
                    "Здравствуйте, %s!\n\n" +
                    "Исполнитель %s завершил работу по вашему заказу \"%s\".\n\n" +
                    "Теперь вы можете проверить выполненную работу и при необходимости завершить заказ.\n\n" +
                    "С уважением,\n" +
                    "Команда TaskTrove",
                    customer.getName() != null ? customer.getName() : "Уважаемый заказчик",
                    performerName,
                    orderTitle
                );
                
                emailService.sendEmail(customerEmail, emailSubject, emailText);
                logger.info("Work completion email sent to customer: {}", customerEmail);
            } catch (Exception e) {
                logger.error("Failed to send work completion email to customer: {}", e.getMessage(), e);
            }
        }
    }
}
