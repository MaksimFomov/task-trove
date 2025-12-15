package com.fomov.tasktroveapi.repository;

import com.fomov.tasktroveapi.model.Portfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, Integer> {
    
    @Query("SELECT p FROM Portfolio p LEFT JOIN FETCH p.performer LEFT JOIN FETCH p.customer WHERE p.performer.id = :performerId")
    List<Portfolio> findByPerformerIdWithPerformer(@Param("performerId") Integer performerId);
    
    @Query("SELECT p FROM Portfolio p LEFT JOIN FETCH p.performer LEFT JOIN FETCH p.customer WHERE p.customer.id = :customerId")
    List<Portfolio> findByCustomerIdWithCustomer(@Param("customerId") Integer customerId);
    
    @Query("SELECT p FROM Portfolio p LEFT JOIN FETCH p.performer LEFT JOIN FETCH p.customer WHERE p.id = :id")
    Optional<Portfolio> findByIdWithOwner(@Param("id") Integer id);
    
    @Query("SELECT p FROM Portfolio p LEFT JOIN FETCH p.performer LEFT JOIN FETCH p.customer")
    List<Portfolio> findAllWithOwner();
    
    @Query("SELECT p FROM Portfolio p LEFT JOIN FETCH p.performer LEFT JOIN FETCH p.customer WHERE p.ownerType = :ownerType AND (p.performer.id = :userId OR p.customer.id = :userId)")
    List<Portfolio> findByOwnerTypeAndUserId(@Param("ownerType") String ownerType, @Param("userId") Integer userId);
    
    // Deprecated: Use findByPerformerIdWithPerformer instead
    @Deprecated
    List<Portfolio> findByPerformer_Id(Integer performerId);
    
    // Deprecated: Use findByIdWithOwner instead
    @Deprecated
    @Query("SELECT p FROM Portfolio p LEFT JOIN FETCH p.performer WHERE p.id = :id")
    Optional<Portfolio> findByIdWithPerformer(@Param("id") Integer id);
    
    // Deprecated: Use findAllWithOwner instead
    @Deprecated
    @Query("SELECT p FROM Portfolio p LEFT JOIN FETCH p.performer")
    List<Portfolio> findAllWithPerformer();
}


