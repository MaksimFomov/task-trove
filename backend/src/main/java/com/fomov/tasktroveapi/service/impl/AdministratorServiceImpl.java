package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.model.Administrator;
import com.fomov.tasktroveapi.repository.AdministratorRepository;
import com.fomov.tasktroveapi.service.AdministratorService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class AdministratorServiceImpl implements AdministratorService {

    private final AdministratorRepository repository;

    public AdministratorServiceImpl(AdministratorRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Administrator> findAll() { return repository.findAll(); }

    @Override
    @Transactional(readOnly = true)
    public Optional<Administrator> findById(Integer id) { return repository.findById(id); }

    @Override
    public Administrator save(Administrator administrator) { return repository.save(administrator); }

    @Override
    public void deleteById(Integer id) { repository.deleteById(id); }
}
