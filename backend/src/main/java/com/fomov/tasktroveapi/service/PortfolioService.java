package com.fomov.tasktroveapi.service;

import com.fomov.tasktroveapi.dto.UpdatePortfolioDto;
import com.fomov.tasktroveapi.model.Portfolio;

import java.util.List;
import java.util.Optional;

public interface PortfolioService {
    List<Portfolio> findAll();
    Optional<Portfolio> findById(Integer id);
    Portfolio save(Portfolio portfolio);
    void deleteById(Integer id);
    List<Portfolio> findByUserId(Integer userId);
    void updateStatusByUserId(Integer userId, String status);
    Portfolio updatePortfolio(Integer performerId, UpdatePortfolioDto dto);
}


