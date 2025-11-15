package com.fomov.tasktroveapi.repository;

import com.fomov.tasktroveapi.model.WorkExperience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkExperienceRepository extends JpaRepository<WorkExperience, Integer> {
    
    @Query("SELECT we FROM WorkExperience we LEFT JOIN FETCH we.customer LEFT JOIN FETCH we.performer WHERE we.customer.id = :customerId")
    List<WorkExperience> findByCustomerIdWithRelations(@Param("customerId") Integer customerId);
    
    @Query("SELECT we FROM WorkExperience we LEFT JOIN FETCH we.customer LEFT JOIN FETCH we.performer WHERE we.performer.id = :performerId")
    List<WorkExperience> findByPerformerIdWithRelations(@Param("performerId") Integer performerId);
    
    @Query("SELECT we FROM WorkExperience we LEFT JOIN FETCH we.customer LEFT JOIN FETCH we.performer WHERE we.customer.id = :customerId AND we.performer.id = :performerId")
    List<WorkExperience> findByCustomerIdAndPerformerIdWithRelations(@Param("customerId") Integer customerId, 
                                                       @Param("performerId") Integer performerId);
    
    @Query("SELECT we FROM WorkExperience we LEFT JOIN FETCH we.customer LEFT JOIN FETCH we.performer WHERE we.customer.id = :customerId ORDER BY we.createdAt DESC")
    List<WorkExperience> findByCustomerIdOrderByCreatedAtDescWithRelations(@Param("customerId") Integer customerId);
    
    @Query("SELECT we FROM WorkExperience we LEFT JOIN FETCH we.customer LEFT JOIN FETCH we.performer WHERE we.performer.id = :performerId ORDER BY we.createdAt DESC")
    List<WorkExperience> findByPerformerIdOrderByCreatedAtDescWithRelations(@Param("performerId") Integer performerId);
    
    @Query("SELECT we FROM WorkExperience we LEFT JOIN FETCH we.customer LEFT JOIN FETCH we.performer WHERE we.id = :id")
    Optional<WorkExperience> findByIdWithRelations(@Param("id") Integer id);
    
    @Query("SELECT we FROM WorkExperience we LEFT JOIN FETCH we.customer LEFT JOIN FETCH we.performer")
    List<WorkExperience> findAllWithRelations();
    
    // Deprecated: Use findByCustomerIdWithRelations instead
    @Deprecated
    List<WorkExperience> findByCustomer_Id(Integer customerId);
    
    // Deprecated: Use findByPerformerIdWithRelations instead
    @Deprecated
    List<WorkExperience> findByPerformer_Id(Integer performerId);
    
    // Deprecated: Use findByCustomerIdAndPerformerIdWithRelations instead
    @Deprecated
    @Query("SELECT we FROM WorkExperience we WHERE we.customer.id = :customerId AND we.performer.id = :performerId")
    List<WorkExperience> findByCustomerIdAndPerformerId(@Param("customerId") Integer customerId, 
                                                       @Param("performerId") Integer performerId);
    
    // Deprecated: Use findByCustomerIdOrderByCreatedAtDescWithRelations instead
    @Deprecated
    @Query("SELECT we FROM WorkExperience we WHERE we.customer.id = :customerId ORDER BY we.createdAt DESC")
    List<WorkExperience> findByCustomerIdOrderByCreatedAtDesc(@Param("customerId") Integer customerId);
    
    // Deprecated: Use findByPerformerIdOrderByCreatedAtDescWithRelations instead
    @Deprecated
    @Query("SELECT we FROM WorkExperience we WHERE we.performer.id = :performerId ORDER BY we.createdAt DESC")
    List<WorkExperience> findByPerformerIdOrderByCreatedAtDesc(@Param("performerId") Integer performerId);
}
