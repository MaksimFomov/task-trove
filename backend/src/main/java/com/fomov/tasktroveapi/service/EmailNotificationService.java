package com.fomov.tasktroveapi.service;

import com.fomov.tasktroveapi.model.Customer;
import com.fomov.tasktroveapi.model.Performer;

public interface EmailNotificationService {
    void sendCorrectionRequestEmail(String performerEmail, String emailText, String attachmentPath);
    void sendPerformerApprovalEmail(String performerEmail, String emailText, String attachmentPath);
    void sendPerformerRefusalEmail(Performer performer, String performerName, String customerName, String orderTitle);
    void sendWorkCompletionEmail(Customer customer, String performerName, String orderTitle);
    void sendCustomerRefusalEmail(Customer customer, String performerName, String orderTitle);
}

