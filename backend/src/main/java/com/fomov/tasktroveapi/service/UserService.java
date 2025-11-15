package com.fomov.tasktroveapi.service;

import com.fomov.tasktroveapi.model.User;

import java.util.List;
import java.util.Optional;

public interface UserService {
    
    List<User> findAll();
    
    Optional<User> findById(Integer id);
    
    User save(User user);
    
    void deleteById(Integer id);
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
}
