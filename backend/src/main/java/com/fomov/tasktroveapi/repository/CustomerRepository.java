package com.fomov.tasktroveapi.repository;

import com.fomov.tasktroveapi.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {
    @Query("SELECT c FROM Customer c WHERE c.account.email = :email")
    Optional<Customer> findByEmail(@Param("email") String email);
    
    @Query("SELECT COUNT(c) > 0 FROM Customer c WHERE c.account.email = :email")
    boolean existsByEmail(@Param("email") String email);
    
    @Query("SELECT c FROM Customer c LEFT JOIN FETCH c.account WHERE c.account.id = :accountId")
    Optional<Customer> findByAccountId(@Param("accountId") Integer accountId);
    
    @Query("SELECT c FROM Customer c LEFT JOIN FETCH c.account LEFT JOIN FETCH c.account.role WHERE c.id = :id")
    Optional<Customer> findByIdWithAccount(@Param("id") Integer id);
}
