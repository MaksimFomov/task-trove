package com.fomov.tasktroveapi.repository;

import com.fomov.tasktroveapi.model.Performer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PerformerRepository extends JpaRepository<Performer, Integer> {
    @Query("SELECT p FROM Performer p WHERE p.account.email = :email")
    Optional<Performer> findByEmail(@Param("email") String email);
    
    @Query("SELECT COUNT(p) > 0 FROM Performer p WHERE p.account.email = :email")
    boolean existsByEmail(@Param("email") String email);
    
    Optional<Performer> findByAccountId(Integer accountId);
    
    @Query("SELECT p FROM Performer p LEFT JOIN FETCH p.account WHERE p.id = :id")
    Optional<Performer> findByIdWithAccount(@Param("id") Integer id);
    
    @Query("SELECT p FROM Performer p LEFT JOIN FETCH p.account")
    java.util.List<Performer> findAllOrderByRatingDesc();
}
