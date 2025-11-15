package com.fomov.tasktroveapi.service;

import com.fomov.tasktroveapi.model.Role;

import java.util.List;
import java.util.Optional;

public interface RoleService {
    
    List<Role> findAll();
    
    Optional<Role> findById(Integer id);
    
    Role save(Role role);
    
    void deleteById(Integer id);
    
    Optional<Role> findByName(String name);
    
    boolean existsByName(String name);
}
