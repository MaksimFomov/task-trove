package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.model.WorkExperience;
import com.fomov.tasktroveapi.repository.WorkExperienceRepository;
import com.fomov.tasktroveapi.service.WorkExperienceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class WorkExperienceServiceImpl implements WorkExperienceService {

    private final WorkExperienceRepository repository;

    public WorkExperienceServiceImpl(WorkExperienceRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkExperience> findAll() {
        return repository.findAllWithRelations();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<WorkExperience> findById(Integer id) {
        return repository.findByIdWithRelations(id);
    }

    @Override
    public WorkExperience save(WorkExperience workExperience) {
        return repository.save(workExperience);
    }

    @Override
    public void deleteById(Integer id) {
        repository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkExperience> findByCustomerId(Integer customerId) {
        return repository.findByCustomerIdWithRelations(customerId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkExperience> findByPerformerId(Integer performerId) {
        return repository.findByPerformerIdWithRelations(performerId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkExperience> findByCustomerIdAndPerformerId(Integer customerId, Integer performerId) {
        return repository.findByCustomerIdAndPerformerIdWithRelations(customerId, performerId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkExperience> findByCustomerIdOrderByCreatedAtDesc(Integer customerId) {
        return repository.findByCustomerIdOrderByCreatedAtDescWithRelations(customerId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkExperience> findByPerformerIdOrderByCreatedAtDesc(Integer performerId) {
        return repository.findByPerformerIdOrderByCreatedAtDescWithRelations(performerId);
    }
}
