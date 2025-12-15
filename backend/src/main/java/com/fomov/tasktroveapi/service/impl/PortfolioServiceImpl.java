package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.dto.UpdatePortfolioDto;
import com.fomov.tasktroveapi.dto.UpdateCustomerPortfolioDto;
import com.fomov.tasktroveapi.exception.NotFoundException;
import com.fomov.tasktroveapi.model.Customer;
import com.fomov.tasktroveapi.model.Performer;
import com.fomov.tasktroveapi.model.Portfolio;
import com.fomov.tasktroveapi.repository.CustomerRepository;
import com.fomov.tasktroveapi.repository.PerformerRepository;
import com.fomov.tasktroveapi.repository.PortfolioRepository;
import com.fomov.tasktroveapi.service.PortfolioService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class PortfolioServiceImpl implements PortfolioService {

    private final PortfolioRepository repository;
    private final PerformerRepository performerRepository;
    private final CustomerRepository customerRepository;

    public PortfolioServiceImpl(PortfolioRepository repository, PerformerRepository performerRepository, CustomerRepository customerRepository) {
        this.repository = repository;
        this.performerRepository = performerRepository;
        this.customerRepository = customerRepository;
    }

    @Override
    public List<Portfolio> findAll() {
        return repository.findAllWithOwner();
    }

    @Override
    public Optional<Portfolio> findById(Integer id) {
        return repository.findByIdWithOwner(id);
    }

    @Override
    public Portfolio save(Portfolio portfolio) {
        return repository.save(portfolio);
    }

    @Override
    public void deleteById(Integer id) {
        repository.deleteById(id);
    }

    @Override
    public List<Portfolio> findByUserId(Integer userId, String ownerType) {
        return repository.findByOwnerTypeAndUserId(ownerType, userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateStatusByUserId(Integer userId, String status, String ownerType) {
        List<Portfolio> items = repository.findByOwnerTypeAndUserId(ownerType, userId);
        for (Portfolio p : items) {
            if ("ACTIVE".equals(status)) {
                p.setIsActive(true);
            } else if ("INACTIVE".equals(status)) {
                p.setIsActive(false);
            }
        }
        repository.saveAll(items);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Portfolio updatePortfolio(Integer userId, UpdatePortfolioDto dto, String ownerType) {
        List<Portfolio> portfolios = repository.findByOwnerTypeAndUserId(ownerType, userId);
        Portfolio portfolio;
        if (portfolios.isEmpty()) {
            portfolio = new Portfolio();
            if ("PERFORMER".equals(ownerType)) {
                Performer performer = performerRepository.findById(userId)
                        .orElseThrow(() -> new NotFoundException("Performer", userId));
                portfolio.setPerformer(performer);
                portfolio.setOwnerType("PERFORMER");
            } else if ("CUSTOMER".equals(ownerType)) {
                Customer customer = customerRepository.findById(userId)
                        .orElseThrow(() -> new NotFoundException("Customer", userId));
                portfolio.setCustomer(customer);
                portfolio.setOwnerType("CUSTOMER");
            } else {
                throw new IllegalArgumentException("Invalid owner type: " + ownerType);
            }
        } else {
            portfolio = portfolios.get(0);
        }

        // Обновляем поля
        portfolio.setPhone(dto.getPhone());
        portfolio.setTownCountry(dto.getTownCountry());
        portfolio.setSpecializations(dto.getSpecializations());
        portfolio.setEmployment(dto.getEmployment());
        portfolio.setExperience(dto.getExperience());
        
        // Для Customer description и scopeS обновляются через отдельный метод updatePortfolio с UpdateCustomerPortfolioDto

        Portfolio saved = repository.save(portfolio);
        return saved;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Portfolio updatePortfolio(Integer userId, UpdateCustomerPortfolioDto dto, String ownerType) {
        List<Portfolio> portfolios = repository.findByOwnerTypeAndUserId(ownerType, userId);
        Portfolio portfolio;
        if (portfolios.isEmpty()) {
            portfolio = new Portfolio();
            if ("CUSTOMER".equals(ownerType)) {
                Customer customer = customerRepository.findById(userId)
                        .orElseThrow(() -> new NotFoundException("Customer", userId));
                portfolio.setCustomer(customer);
                portfolio.setOwnerType("CUSTOMER");
            } else {
                throw new IllegalArgumentException("Invalid owner type for UpdateCustomerPortfolioDto: " + ownerType);
            }
        } else {
            portfolio = portfolios.get(0);
        }

        // Обновляем поля
        portfolio.setPhone(dto.getPhone());
        portfolio.setDescription(dto.getDescription());
        portfolio.setScopeS(dto.getScopeS());

        Portfolio saved = repository.save(portfolio);
        return saved;
    }
    
    // Deprecated methods for backward compatibility
    @Override
    @Deprecated
    public List<Portfolio> findByUserId(Integer userId) {
        return repository.findByPerformerIdWithPerformer(userId);
    }

    @Override
    @Deprecated
    @Transactional(rollbackFor = Exception.class)
    public void updateStatusByUserId(Integer userId, String status) {
        updateStatusByUserId(userId, status, "PERFORMER");
    }

    @Override
    @Deprecated
    @Transactional(rollbackFor = Exception.class)
    public Portfolio updatePortfolio(Integer performerId, UpdatePortfolioDto dto) {
        return updatePortfolio(performerId, dto, "PERFORMER");
    }
}


