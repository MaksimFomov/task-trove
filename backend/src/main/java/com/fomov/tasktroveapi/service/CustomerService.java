package com.fomov.tasktroveapi.service;

import com.fomov.tasktroveapi.dto.*;
import com.fomov.tasktroveapi.model.Customer;
import com.fomov.tasktroveapi.model.Orders;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface CustomerService {
    List<Customer> findAll();
    Optional<Customer> findById(Integer id);
    Optional<Customer> findByIdWithAccount(Integer id);
    Customer save(Customer customer);
    void deleteById(Integer id);
    Optional<Customer> findByAccountId(Integer accountId);
    
    // Business logic methods
    Map<String, Object> getCustomerOrders(Integer accountId, String searchTerm);
    AddOrderDto getOrderWithReplies(Integer orderId);
    Map<String, Object> getDoneOrders(Integer accountId);
    Map<String, Object> getCustomerChats(Integer accountId, String tab);
    Map<String, Object> getChatMessages(Integer accountId, Integer chatId);
    void markChatAsRead(Integer accountId, Integer chatId);
    void createOrder(Integer accountId, AddOrderDto dto);
    void updateOrder(Integer accountId, Integer orderId, AddOrderDto dto);
    void deleteOrder(Integer accountId, Integer orderId);
    void permanentlyDeleteOrder(Integer accountId, Integer orderId);
    void assignPerformerToOrder(Integer accountId, AddPerformerToOrderDto dto);
    void updateOrderStatus(Integer accountId, ReadyOrderDto dto);
    void addReview(Integer accountId, WorkExperienceDto dto);
    void sendEmailToPerformer(Integer accountId, Integer orderId, Integer performerId, 
                             String text, MultipartFile document, Boolean isCorrection);
    void refusePerformer(Integer accountId, Integer orderId);
    void deleteChat(Integer accountId, Integer chatId);
    Customer getPortfolio(Integer accountId);
    void updatePortfolio(Integer accountId, UpdateCustomerPortfolioDto dto);
    Map<String, Object> getMyReviews(Integer accountId);
}
