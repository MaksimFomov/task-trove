package com.fomov.tasktroveapi.controller;

import com.fomov.tasktroveapi.dto.*;
import com.fomov.tasktroveapi.exception.NotFoundException;
import com.fomov.tasktroveapi.mapper.PerformerMapper;
import com.fomov.tasktroveapi.model.*;
import com.fomov.tasktroveapi.security.SecurityUtils;
import com.fomov.tasktroveapi.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@RestController
@RequestMapping("/api/performers")
@PreAuthorize("hasRole('Performer')")
public class PerformerController {

    private static final Logger logger = LoggerFactory.getLogger(PerformerController.class);

    private final PerformerService service;
    private final PerformerMapper mapper;
    private final PortfolioService portfolioService;

    public PerformerController(PerformerService service, 
                              PerformerMapper mapper,
                              PortfolioService portfolioService) {
        this.service = service;
        this.mapper = mapper;
        this.portfolioService = portfolioService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPerformerById(@PathVariable Integer id) {
        try {
            return service.findById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error getting performer by id: {}", id, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get performer"));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody RegistrationAccDto dto) {
        try {
            Performer e = mapper.toEntity(dto);
            return ResponseEntity.ok(service.save(e));
        } catch (Exception e) {
            logger.error("Error creating performer", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to create performer"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody RegistrationAccDto dto) {
        try {
            return service.findById(id).map(existing -> {
                Performer updated = mapper.toEntity(dto);
                updated.setId(id);
                return ResponseEntity.ok(service.save(updated));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error updating performer: {}", id, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to update performer"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        try {
            service.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error deleting performer: {}", id, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to delete performer"));
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<Map<String, Object>> listOrders(
            @RequestParam(value = "searchTerm", required = false) String searchTerm,
            @RequestParam(value = "sortBy", required = false) String sortBy,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "pageSize", defaultValue = "50") int pageSize) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            Map<String, Object> result = service.getAvailableOrders(accountId, searchTerm, sortBy, page, pageSize);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error listing orders", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to list orders"));
        }
    }

    @GetMapping("/my-orders")
    public ResponseEntity<Map<String, Object>> getMyActiveOrders(
            @RequestParam(value = "searchTerm", required = false) String searchTerm) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            Map<String, Object> result = service.getMyActiveOrders(accountId, searchTerm);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error getting my active orders", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get active orders"));
        }
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Integer id) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            AddOrderDto dto = service.getOrderDetails(accountId, id);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("Error getting order by id: {}", id, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get order"));
        }
    }

    @GetMapping("/replies")
    public ResponseEntity<Map<String, Object>> getAllReplies(
            @RequestParam(value = "tab", required = false) String tab) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            Map<String, Object> result = service.getMyReplies(accountId, tab);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error getting replies", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get replies"));
        }
    }

    @GetMapping("/chats")
    public ResponseEntity<Map<String, Object>> getAllChats(
            @RequestParam(value = "tab", required = false) String tab) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            Map<String, Object> result = service.getMyChats(accountId, tab);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error getting chats", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get chats"));
        }
    }

    @GetMapping("/messages")
    public ResponseEntity<Map<String, Object>> getAllMessage(
            @RequestParam("chatId") Integer chatId) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            Map<String, Object> result = service.getChatMessages(accountId, chatId);
            return ResponseEntity.ok(result);
        } catch (SecurityException e) {
            logger.warn("Access denied to chat: {}", chatId);
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        } catch (Exception e) {
            logger.error("Error getting messages for chat: {}", chatId, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get messages"));
        }
    }

    @PostMapping("/addreply")
    public ResponseEntity<?> createReply(@RequestBody ReplyDto dto) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            Integer replyId = service.createReply(accountId, dto);
            return ResponseEntity.ok(replyId);
        } catch (Exception e) {
            logger.error("Error creating reply", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to create reply"));
        }
    }

    @PutMapping("/readytask")
    public ResponseEntity<?> updateTaskStatus(@RequestBody UpdateReplyDto dto) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            service.updateTaskStatus(accountId, dto);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            logger.warn("Access denied: {}", e.getMessage());
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        } catch (Exception e) {
            logger.error("Error updating task status", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to update task status"));
        }
    }

    @PutMapping("/updateportfolio")
    public ResponseEntity<?> updatePortfolio(@RequestBody @Validated UpdatePortfolioDto dto) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            service.updatePortfolio(accountId, dto);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error updating portfolio", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to update portfolio"));
        }
    }

    @DeleteMapping("/deletereply/{id}")
    public ResponseEntity<?> deleteReply(@PathVariable Integer id) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            service.deleteReply(accountId, id);
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            logger.warn("Access denied to reply: {}", id);
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        } catch (Exception e) {
            logger.error("Error deleting reply: {}", id, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to delete reply"));
        }
    }

    @DeleteMapping("/deletecompleted/{id}")
    public ResponseEntity<?> deleteCompletedReply(@PathVariable Integer id) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            service.deleteCompletedReply(accountId, id);
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            logger.warn("Access denied to completed reply: {}", id);
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        } catch (IllegalStateException e) {
            logger.warn("Invalid state for deleting reply: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error deleting completed reply: {}", id, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to delete completed reply"));
        }
    }

    @PostMapping("/refuse-order/{orderId}")
    public ResponseEntity<?> refuseOrder(@PathVariable Integer orderId) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            service.refuseOrder(accountId, orderId);
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            logger.warn("Access denied to refuse order: {}", orderId);
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            logger.warn("Invalid state for refusing order: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error refusing order: {}", orderId, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to refuse order"));
        }
    }

    @GetMapping("/portfolio")
    public ResponseEntity<?> getPortfolio() {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            Performer performer = service.findByAccountId(accountId)
                    .orElseThrow(() -> new RuntimeException("Performer not found"));
            
            java.util.List<Portfolio> portfolios = portfolioService.findByUserId(performer.getId());
            Portfolio portfolio = portfolios.isEmpty() ? null : portfolios.get(0);
            return ResponseEntity.ok(portfolio);
        } catch (Exception e) {
            logger.error("Error getting portfolio", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get portfolio"));
        }
    }

    @GetMapping("/info")
    public ResponseEntity<?> getInfo() {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            Map<String, Object> info = service.getPerformerInfo(accountId);
            return ResponseEntity.ok(info);
        } catch (Exception e) {
            logger.error("Error getting performer info", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get performer info"));
        }
    }

    @GetMapping("/reviews")
    public ResponseEntity<Map<String, Object>> getMyReviews() {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            Map<String, Object> result = service.getMyReviews(accountId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error getting reviews", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get reviews"));
        }
    }

    @DeleteMapping("/chats/{chatId}")
    public ResponseEntity<?> deleteChat(@PathVariable Integer chatId) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            service.deleteChat(accountId, chatId);
            return ResponseEntity.ok().build();
        } catch (NotFoundException e) {
            logger.error("Chat or performer not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            logger.error("Access denied: {}", e.getMessage());
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            logger.error("Invalid state: {}", e.getMessage());
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error deleting chat: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to delete chat"));
        }
    }
}


