package com.fomov.tasktroveapi.controller;

import com.fomov.tasktroveapi.model.Administrator;
import com.fomov.tasktroveapi.service.AdministratorService;
import com.fomov.tasktroveapi.service.PortfolioService;
import com.fomov.tasktroveapi.repository.AccountRepository;
import com.fomov.tasktroveapi.repository.ReplyRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/administrators", "/api/admin"})
@PreAuthorize("hasRole('Administrator')")
public class AdministratorController {

    private final AdministratorService service;
    private final PortfolioService portfolioService;
    private final AccountRepository accountRepository;
    private final ReplyRepository replyRepository;

    public AdministratorController(AdministratorService service, PortfolioService portfolioService, AccountRepository accountRepository, ReplyRepository replyRepository) {
        this.service = service;
        this.portfolioService = portfolioService;
        this.accountRepository = accountRepository;
        this.replyRepository = replyRepository;
    }

    @GetMapping
    public List<Administrator> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Administrator> get(@PathVariable Integer id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Administrator> create(@RequestBody Administrator dto) {
        return ResponseEntity.ok(service.save(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Administrator> update(@PathVariable Integer id, @RequestBody Administrator dto) {
        return service.findById(id).map(existing -> {
            dto.setId(id);
            return ResponseEntity.ok(service.save(dto));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        service.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/portfolio")
    public ResponseEntity<?> getPortfolio(@RequestParam("userId") Integer userId) {
        return ResponseEntity.ok(portfolioService.findByUserId(userId));
    }

    @GetMapping("/getusers")
    public ResponseEntity<Map<String, Object>> getUsers() {
        return ResponseEntity.ok(Map.of("users", accountRepository.findAll()));
    }

    @GetMapping("/info")
    public ResponseEntity<?> getInfo(@RequestParam("userId") Integer userId) {
        return ResponseEntity.ok(accountRepository.findById(userId));
    }

    @PostMapping("/activate")
    public ResponseEntity<?> activate(@RequestParam("userId") Integer userId) {
        portfolioService.updateStatusByUserId(userId, "ACTIVE");
        return ResponseEntity.ok(portfolioService.findByUserId(userId));
    }

    @PostMapping("/disactivate")
    public ResponseEntity<?> disactivate(@RequestParam("userId") Integer userId) {
        portfolioService.updateStatusByUserId(userId, "INACTIVE");
        return ResponseEntity.ok(portfolioService.findByUserId(userId));
    }

    @DeleteMapping("/deletecomment")
    public ResponseEntity<?> deleteComment(@RequestParam("id") Integer id) {
        replyRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}


