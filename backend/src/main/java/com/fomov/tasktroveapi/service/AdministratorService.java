package com.fomov.tasktroveapi.service;

import com.fomov.tasktroveapi.model.Administrator;

import java.util.List;
import java.util.Optional;

public interface AdministratorService {
    List<Administrator> findAll();
    Optional<Administrator> findById(Integer id);
    Administrator save(Administrator administrator);
    void deleteById(Integer id);
}
