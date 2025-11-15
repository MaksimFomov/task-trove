package com.fomov.tasktroveapi.service;

import com.fomov.tasktroveapi.model.Customer;
import com.fomov.tasktroveapi.model.Performer;

/**
 * Service for sending email notifications
 */
public interface NotificationService {
    
    /**
     * Send email to performer when they are approved for an order
     * @param performerEmail Performer's email address
     * @param emailText Email body text
     * @param attachmentPath Optional attachment path
     */
    void sendPerformerApprovalEmail(String performerEmail, String emailText, String attachmentPath);
    
    /**
     * Send email to performer when corrections are requested
     * @param performerEmail Performer's email address
     * @param emailText Email body text
     * @param attachmentPath Optional attachment path
     */
    void sendCorrectionRequestEmail(String performerEmail, String emailText, String attachmentPath);
    
    /**
     * Send email to performer when customer refuses their services
     * @param performer Performer entity
     * @param performerName Performer's name
     * @param customerName Customer's name
     * @param orderTitle Order title
     */
    void sendPerformerRefusalEmail(Performer performer, String performerName, String customerName, String orderTitle);
    
    /**
     * Send email to customer when performer refuses the order
     * @param customer Customer entity
     * @param performerName Performer's name
     * @param orderTitle Order title
     */
    void sendCustomerRefusalEmail(Customer customer, String performerName, String orderTitle);
    
    /**
     * Send email to customer when performer completes the work
     * @param customer Customer entity
     * @param performerName Performer's name
     * @param orderTitle Order title
     */
    void sendWorkCompletionEmail(Customer customer, String performerName, String orderTitle);
}
