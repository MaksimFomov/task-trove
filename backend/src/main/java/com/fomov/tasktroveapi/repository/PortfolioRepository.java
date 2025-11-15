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
    
    @Query("SELECT p FROM Portfolio p LEFT JOIN FETCH p.performer WHERE p.performer.id = :performerId")
    List<Portfolio> findByPerformerIdWithPerformer(@Param("performerId") Integer performerId);
    
    @Query("SELECT p FROM Portfolio p LEFT JOIN FETCH p.performer WHERE p.id = :id")
    Optional<Portfolio> findByIdWithPerformer(@Param("id") Integer id);
    
    @Query("SELECT p FROM Portfolio p LEFT JOIN FETCH p.performer")
    List<Portfolio> findAllWithPerformer();
    
    // Deprecated: Use findByPerformerIdWithPerformer instead
    @Deprecated
    List<Portfolio> findByPerformer_Id(Integer performerId);
}


