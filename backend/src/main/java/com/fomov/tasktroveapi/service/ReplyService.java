package com.fomov.tasktroveapi.service;

import com.fomov.tasktroveapi.model.Reply;

import java.util.List;
import java.util.Optional;

public interface ReplyService {
    List<Reply> findAll();
    Optional<Reply> findById(Integer id);
    Reply save(Reply reply);
    void deleteById(Integer id);
    List<Reply> findByOrderId(Integer orderId);
    List<Reply> findByPerformerId(Integer performerId);
    boolean existsByOrderIdAndPerformerId(Integer orderId, Integer performerId);
    List<Reply> findByPerformerIdWithRelations(Integer performerId);
    List<Reply> findByOrderIdWithRelations(Integer orderId);
    int updateIsOnCustomerByOrderIdAndPerformerId(Integer orderId, Integer performerId);
    int deleteByOrderIdAndPerformerId(Integer orderId, Integer performerId);
}

