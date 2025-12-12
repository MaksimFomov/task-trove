package com.fomov.tasktroveapi.repository;

import com.fomov.tasktroveapi.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Integer> {
    Optional<Account> findByLogin(String login);
    Optional<Account> findByEmail(String email);
    
    @Query("SELECT a FROM Account a LEFT JOIN FETCH a.role WHERE a.login = :login")
    Optional<Account> findByLoginWithRole(@Param("login") String login);
    
    @Query("SELECT a FROM Account a LEFT JOIN FETCH a.role WHERE a.id = :id")
    Optional<Account> findByIdWithRole(@Param("id") Integer id);
    
    @Query("SELECT a FROM Account a LEFT JOIN FETCH a.role")
    java.util.List<Account> findAllWithRole();
}


