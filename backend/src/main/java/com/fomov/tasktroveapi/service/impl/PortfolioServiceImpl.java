package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.dto.UpdatePortfolioDto;
import com.fomov.tasktroveapi.exception.NotFoundException;
import com.fomov.tasktroveapi.model.Performer;
import com.fomov.tasktroveapi.model.Portfolio;
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

    public PortfolioServiceImpl(PortfolioRepository repository, PerformerRepository performerRepository) {
        this.repository = repository;
        this.performerRepository = performerRepository;
    }

    @Override
    public List<Portfolio> findAll() {
        return repository.findAllWithPerformer();
    }

    @Override
    public Optional<Portfolio> findById(Integer id) {
        return repository.findByIdWithPerformer(id);
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
    public List<Portfolio> findByUserId(Integer userId) {
        return repository.findByPerformerIdWithPerformer(userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateStatusByUserId(Integer userId, String status) {
        List<Portfolio> items = repository.findByPerformerIdWithPerformer(userId);
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
    public Portfolio updatePortfolio(Integer performerId, UpdatePortfolioDto dto) {
        List<Portfolio> portfolios = repository.findByPerformerIdWithPerformer(performerId);
        Portfolio portfolio;
        if (portfolios.isEmpty()) {
            portfolio = new Portfolio();
            // Получаем Performer и устанавливаем связь
            Performer performer = performerRepository.findById(performerId)
                    .orElseThrow(() -> new NotFoundException("Performer", performerId));
            portfolio.setPerformer(performer);
        } else {
            portfolio = portfolios.get(0);
        }

        // Обновляем только разрешенные поля
        // name и email не обновляются - они берутся из Account при регистрации и остаются неизменными
        // portfolio.setName(...) - не обновляем
        // portfolio.setEmail(...) - не обновляем
        portfolio.setPhone(dto.getPhone());
        portfolio.setTownCountry(dto.getTownCountry());
        portfolio.setSpecializations(dto.getSpecializations());
        portfolio.setEmployment(dto.getEmployment());
        portfolio.setExperience(dto.getExperience());

        Portfolio saved = repository.save(portfolio);
        return saved;
    }
}


