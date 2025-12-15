package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.model.OrderStatus;
import com.fomov.tasktroveapi.model.Orders;
import com.fomov.tasktroveapi.repository.OrdersRepository;
import com.fomov.tasktroveapi.service.OrdersService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class OrdersServiceImpl implements OrdersService {

    private final OrdersRepository repository;

    public OrdersServiceImpl(OrdersRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<Orders> findAll() {
        return repository.findAll();
    }

    @Override
    public Optional<Orders> findById(Integer id) {
        return repository.findById(id);
    }

    @Override
    public Orders save(Orders order) {
        return repository.save(order);
    }

    @Override
    public void deleteById(Integer id) {
        repository.deleteById(id);
    }

    @Override
    public List<Orders> findByCustomerId(Integer customerId) {
        return repository.findByCustomerId(customerId);
    }

    @Override
    public List<Orders> findByPerformerId(Integer performerId) {
        return repository.findByPerformerId(performerId);
    }

    @Override
    public List<Orders> findByStatus(OrderStatus status) {
        return repository.findByStatus(status);
    }

    @Override
    public List<Orders> findByTitleContaining(String titlePart) {
        return repository.findByTitleContainingIgnoreCase(titlePart);
    }
    
    @Override
    public List<Orders> findAllActive() {
        return repository.findAllActive();
    }
    
    @Override
    public List<Orders> findByTitleContainingAndActive(String titlePart) {
        return repository.findByTitleContainingIgnoreCaseAndActive(titlePart);
    }
}


