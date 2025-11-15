package com.fomov.tasktroveapi.service;

import com.fomov.tasktroveapi.model.Reply;

/**
 * Service for common Reply update operations
 */
public interface ReplyUpdateService {
    
    /**
     * Update Reply status when performer is assigned to order
     * @param orderId Order ID
     * @param performerId Performer ID
     * @return Number of updated rows
     */
    int updateReplyOnPerformerAssignment(Integer orderId, Integer performerId);
    
    /**
     * Update Reply status when task is marked as done
     * @param orderId Order ID
     * @param performerId Performer ID
     */
    void updateReplyOnTaskCompletion(Integer orderId, Integer performerId);
    
    /**
     * Update Reply status when order is marked as done by customer
     * @param orderId Order ID
     * @param performerId Performer ID
     */
    void updateReplyOnOrderCompletion(Integer orderId, Integer performerId);
    
    /**
     * Reset Reply status when corrections are requested
     * @param orderId Order ID
     * @param performerId Performer ID
     */
    void resetReplyOnCorrection(Integer orderId, Integer performerId);
}
