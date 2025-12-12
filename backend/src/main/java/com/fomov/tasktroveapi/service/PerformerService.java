package com.fomov.tasktroveapi.service;

import com.fomov.tasktroveapi.dto.*;
import com.fomov.tasktroveapi.model.Performer;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface PerformerService {
    List<Performer> findAll();
    Optional<Performer> findById(Integer id);
    Performer save(Performer performer);
    void deleteById(Integer id);
    Optional<Performer> findByAccountId(Integer accountId);
    Optional<Performer> findByIdWithAccount(Integer id);
    
    // Business logic methods
    Map<String, Object> getAvailableOrders(Integer accountId, String searchTerm, String sortBy, int page, int pageSize);
    Map<String, Object> getMyActiveOrders(Integer accountId, String searchTerm);
    AddOrderDto getOrderDetails(Integer accountId, Integer orderId);
    Map<String, Object> getMyReplies(Integer accountId, String tab);
    Map<String, Object> getMyChats(Integer accountId, String tab);
    Map<String, Object> getChatMessages(Integer accountId, Integer chatId);
    void markChatAsRead(Integer accountId, Integer chatId);
    Integer createReply(Integer accountId, ReplyDto dto);
    void updateTaskStatus(Integer accountId, UpdateReplyDto dto);
    void updatePortfolio(Integer accountId, UpdatePortfolioDto dto);
    void deleteReply(Integer accountId, Integer replyId);
    void deleteCompletedReply(Integer accountId, Integer replyId);
    void refuseOrder(Integer accountId, Integer orderId);
    Map<String, Object> getPerformerInfo(Integer accountId);
    Map<String, Object> getMyReviews(Integer accountId);
    void deleteChat(Integer accountId, Integer chatId);
    void addReview(Integer accountId, WorkExperienceDto dto);
}
