package com.fomov.tasktroveapi.service;

import com.fomov.tasktroveapi.model.WorkExperience;

import java.util.List;
import java.util.Optional;

public interface WorkExperienceService {
    
    List<WorkExperience> findAll();
    
    Optional<WorkExperience> findById(Integer id);
    
    WorkExperience save(WorkExperience workExperience);
    
    void deleteById(Integer id);
    
    List<WorkExperience> findByCustomerId(Integer customerId);
    
    List<WorkExperience> findByPerformerId(Integer performerId);
    
    List<WorkExperience> findByCustomerIdAndPerformerId(Integer customerId, Integer performerId);
    
    List<WorkExperience> findByCustomerIdOrderByCreatedAtDesc(Integer customerId);
    
    List<WorkExperience> findByPerformerIdOrderByCreatedAtDesc(Integer performerId);
}
