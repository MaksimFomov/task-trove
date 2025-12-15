package com.fomov.tasktroveapi.service;

import com.fomov.tasktroveapi.dto.UpdatePortfolioDto;
import com.fomov.tasktroveapi.dto.UpdateCustomerPortfolioDto;
import com.fomov.tasktroveapi.model.Portfolio;

import java.util.List;
import java.util.Optional;

public interface PortfolioService {
    List<Portfolio> findAll();
    Optional<Portfolio> findById(Integer id);
    Portfolio save(Portfolio portfolio);
    void deleteById(Integer id);
    List<Portfolio> findByUserId(Integer userId, String ownerType);
    void updateStatusByUserId(Integer userId, String status, String ownerType);
    Portfolio updatePortfolio(Integer userId, UpdatePortfolioDto dto, String ownerType);
    Portfolio updatePortfolio(Integer userId, UpdateCustomerPortfolioDto dto, String ownerType);
    
    // Deprecated methods for backward compatibility
    @Deprecated
    List<Portfolio> findByUserId(Integer userId);
    @Deprecated
    void updateStatusByUserId(Integer userId, String status);
    @Deprecated
    Portfolio updatePortfolio(Integer performerId, UpdatePortfolioDto dto);
}


