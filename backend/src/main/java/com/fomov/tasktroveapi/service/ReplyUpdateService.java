package com.fomov.tasktroveapi.service;

/**
 * Service for common Reply update operations
 * @deprecated Флаги Reply удалены, логика теперь через Order.status
 */
@Deprecated
public interface ReplyUpdateService {
    
    /**
     * @deprecated Больше не используется - статус определяется через Order.status
     */
    @Deprecated
    int updateReplyOnPerformerAssignment(Integer orderId, Integer performerId);
    
    /**
     * @deprecated Больше не используется - статус определяется через Order.status
     */
    @Deprecated
    void updateReplyOnTaskCompletion(Integer orderId, Integer performerId);
    
    /**
     * @deprecated Больше не используется - статус определяется через Order.status
     */
    @Deprecated
    void updateReplyOnOrderCompletion(Integer orderId, Integer performerId);
    
    /**
     * @deprecated Больше не используется - статус определяется через Order.status
     */
    @Deprecated
    void resetReplyOnCorrection(Integer orderId, Integer performerId);
}
