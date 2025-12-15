package com.fomov.tasktroveapi.controller;

import com.fomov.tasktroveapi.model.Orders;
import com.fomov.tasktroveapi.model.OrderStatus;
import com.fomov.tasktroveapi.dto.AddOrderDto;
import com.fomov.tasktroveapi.mapper.OrdersMapper;
import com.fomov.tasktroveapi.service.OrdersService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrdersController {

    private final OrdersService service;
    private final OrdersMapper mapper;

    public OrdersController(OrdersService service, OrdersMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public List<AddOrderDto> list(@RequestParam(value = "searchTerm", required = false) String searchTerm,
                                  @RequestParam(value = "status", required = false) String status,
                                  @RequestParam(value = "isActived", required = false) Boolean isActived,
                                  @RequestParam(value = "isInProcess", required = false) Boolean isInProcess,
                                  @RequestParam(value = "isOnCheck", required = false) Boolean isOnCheck,
                                  @RequestParam(value = "isDone", required = false) Boolean isDone) {
        // Поддержка нового параметра status
        if (status != null && !status.isBlank()) {
            try {
                OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
                return service.findByStatus(orderStatus).stream().map(mapper::toDto).collect(Collectors.toList());
            } catch (IllegalArgumentException e) {
                // Игнорируем неверный статус
            }
        }
        // Обратная совместимость со старыми параметрами
        if (Boolean.TRUE.equals(isActived)) {
            return service.findByStatus(OrderStatus.ACTIVE).stream().map(mapper::toDto).collect(Collectors.toList());
        }
        if (Boolean.TRUE.equals(isInProcess)) {
            return service.findByStatus(OrderStatus.IN_PROCESS).stream().map(mapper::toDto).collect(Collectors.toList());
        }
        if (Boolean.TRUE.equals(isOnCheck)) {
            return service.findByStatus(OrderStatus.ON_CHECK).stream().map(mapper::toDto).collect(Collectors.toList());
        }
        if (Boolean.TRUE.equals(isDone)) {
            return service.findByStatus(OrderStatus.DONE).stream().map(mapper::toDto).collect(Collectors.toList());
        }
        if (searchTerm != null && !searchTerm.isBlank()) {
            return service.findByTitleContaining(searchTerm).stream().map(mapper::toDto).collect(Collectors.toList());
        }
        return service.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AddOrderDto> get(@PathVariable Integer id) {
        return service.findById(id).map(mapper::toDto).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('Customer', 'Administrator')")
    public ResponseEntity<AddOrderDto> create(@RequestBody AddOrderDto dto) {
        Orders e = mapper.toEntity(dto);
        Orders saved = service.save(e);
        return ResponseEntity.ok(mapper.toDto(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('Customer', 'Performer', 'Administrator')")
    public ResponseEntity<AddOrderDto> update(@PathVariable Integer id, @RequestBody AddOrderDto dto) {
        return service.findById(id).map(existing -> {
            Orders updated = mapper.toEntity(dto);
            updated.setId(id);
            Orders saved = service.save(updated);
            return ResponseEntity.ok(mapper.toDto(saved));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('Customer', 'Administrator')")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        service.deleteById(id);
        return ResponseEntity.ok().build();
    }
}


