package com.fomov.tasktroveapi.controller;

import com.fomov.tasktroveapi.model.Role;
import com.fomov.tasktroveapi.service.RoleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    @PreAuthorize("hasRole('Administrator')")
    public List<Role> list() {
        return roleService.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('Administrator')")
    public ResponseEntity<Role> get(@PathVariable Integer id) {
        return roleService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('Administrator')")
    public ResponseEntity<Role> create(@RequestBody Role role) {
        if (roleService.existsByName(role.getName())) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(roleService.save(role));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('Administrator')")
    public ResponseEntity<Role> update(@PathVariable Integer id, @RequestBody Role role) {
        return roleService.findById(id).map(existing -> {
            role.setId(id);
            return ResponseEntity.ok(roleService.save(role));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('Administrator')")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        if (roleService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        roleService.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/name/{name}")
    @PreAuthorize("hasRole('Administrator')")
    public ResponseEntity<Role> getByName(@PathVariable String name) {
        return roleService.findByName(name)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
