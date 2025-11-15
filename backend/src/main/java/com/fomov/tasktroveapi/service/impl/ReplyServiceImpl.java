package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.model.Reply;
import com.fomov.tasktroveapi.repository.ReplyRepository;
import com.fomov.tasktroveapi.service.ReplyService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ReplyServiceImpl implements ReplyService {

    private final ReplyRepository repository;

    public ReplyServiceImpl(ReplyRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<Reply> findAll() {
        return repository.findAll();
    }

    @Override
    public Optional<Reply> findById(Integer id) {
        return repository.findById(id);
    }

    @Override
    public Reply save(Reply reply) {
        return repository.save(reply);
    }

    @Override
    public void deleteById(Integer id) {
        repository.deleteById(id);
    }

    @Override
    public List<Reply> findByOrderId(Integer orderId) {
        return repository.findByOrders_Id(orderId);
    }

    @Override
    public List<Reply> findByPerformerId(Integer performerId) {
        return repository.findByPerformer_Id(performerId);
    }

    @Override
    public boolean existsByOrderIdAndPerformerId(Integer orderId, Integer performerId) {
        return repository.existsByOrders_IdAndPerformer_Id(orderId, performerId);
    }
    
    @Override
    public List<Reply> findByPerformerIdWithRelations(Integer performerId) {
        return repository.findByPerformerIdWithRelations(performerId);
    }
    
    @Override
    public List<Reply> findByOrderIdWithRelations(Integer orderId) {
        return repository.findByOrderIdWithRelations(orderId);
    }
    
    @Override
    @org.springframework.transaction.annotation.Transactional
    public int updateIsOnCustomerByOrderIdAndPerformerId(Integer orderId, Integer performerId) {
        return repository.updateIsOnCustomerByOrderIdAndPerformerId(orderId, performerId);
    }
    
    @Override
    @org.springframework.transaction.annotation.Transactional
    public int deleteByOrderIdAndPerformerId(Integer orderId, Integer performerId) {
        return repository.deleteByOrderIdAndPerformerId(orderId, performerId);
    }
}

