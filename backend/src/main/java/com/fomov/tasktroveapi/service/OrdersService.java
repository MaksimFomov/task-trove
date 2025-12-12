package com.fomov.tasktroveapi.service;

import com.fomov.tasktroveapi.model.Orders;

import java.util.List;
import java.util.Optional;

public interface OrdersService {
    List<Orders> findAll();
    Optional<Orders> findById(Integer id);
    Orders save(Orders order);
    void deleteById(Integer id);
    List<Orders> findByCustomerId(Integer customerId);
    List<Orders> findByPerformerId(Integer performerId);
    List<Orders> findByIsDone(boolean isDone);
    List<Orders> findByIsActived(boolean isActived);
    List<Orders> findByIsInProcess(boolean isInProcess);
    List<Orders> findByIsOnCheck(boolean isOnCheck);
    List<Orders> findByIsOnReview(boolean isOnReview);
    List<Orders> findByTitleContaining(String titlePart);
    List<Orders> findAllActive();
    List<Orders> findByTitleContainingAndActive(String titlePart);
}


