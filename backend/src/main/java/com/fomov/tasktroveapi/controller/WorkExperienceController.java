package com.fomov.tasktroveapi.controller;

import com.fomov.tasktroveapi.model.WorkExperience;
import com.fomov.tasktroveapi.service.WorkExperienceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/work-experiences")
public class WorkExperienceController {

    private final WorkExperienceService workExperienceService;

    public WorkExperienceController(WorkExperienceService workExperienceService) {
        this.workExperienceService = workExperienceService;
    }

    @GetMapping
    @PreAuthorize("hasRole('Administrator')")
    public List<WorkExperience> list() {
        return workExperienceService.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('Administrator')")
    public ResponseEntity<WorkExperience> get(@PathVariable Integer id) {
        return workExperienceService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('Customer', 'Performer', 'Administrator')")
    public ResponseEntity<WorkExperience> create(@RequestBody WorkExperience workExperience) {
        return ResponseEntity.ok(workExperienceService.save(workExperience));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('Customer', 'Performer', 'Administrator')")
    public ResponseEntity<WorkExperience> update(@PathVariable Integer id, @RequestBody WorkExperience workExperience) {
        return workExperienceService.findById(id).map(existing -> {
            workExperience.setId(id);
            return ResponseEntity.ok(workExperienceService.save(workExperience));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('Customer', 'Performer', 'Administrator')")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        if (workExperienceService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        workExperienceService.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('Customer', 'Administrator')")
    public List<WorkExperience> getByCustomer(@PathVariable Integer customerId) {
        return workExperienceService.findByCustomerId(customerId);
    }

    @GetMapping("/performer/{performerId}")
    @PreAuthorize("hasAnyRole('Customer', 'Performer', 'Administrator')")
    public List<WorkExperience> getByPerformer(@PathVariable Integer performerId) {
        return workExperienceService.findByPerformerId(performerId);
    }

    @GetMapping("/customer/{customerId}/performer/{performerId}")
    @PreAuthorize("hasAnyRole('Customer', 'Performer', 'Administrator')")
    public List<WorkExperience> getByCustomerAndPerformer(@PathVariable Integer customerId, 
                                                          @PathVariable Integer performerId) {
        return workExperienceService.findByCustomerIdAndPerformerId(customerId, performerId);
    }
}
