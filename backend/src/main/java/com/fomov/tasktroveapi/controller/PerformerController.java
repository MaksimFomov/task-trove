package com.fomov.tasktroveapi.controller;

import com.fomov.tasktroveapi.dto.*;
import com.fomov.tasktroveapi.exception.NotFoundException;
import com.fomov.tasktroveapi.mapper.PerformerMapper;
import com.fomov.tasktroveapi.mapper.OrdersMapper;
import com.fomov.tasktroveapi.mapper.WorkExperienceMapper;
import com.fomov.tasktroveapi.model.*;
import com.fomov.tasktroveapi.security.SecurityUtils;
import com.fomov.tasktroveapi.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/performers")
@PreAuthorize("hasRole('Performer')")
public class PerformerController {

    private static final Logger logger = LoggerFactory.getLogger(PerformerController.class);

    private final PerformerService service;
    private final PerformerMapper mapper;
    private final PortfolioService portfolioService;
    private final CustomerService customerService;
    private final OrdersService ordersService;
    private final WorkExperienceService workExperienceService;
    private final OrdersMapper ordersMapper;
    private final WorkExperienceMapper workExperienceMapper;

    public PerformerController(PerformerService service, 
                              PerformerMapper mapper,
                              PortfolioService portfolioService,
                              CustomerService customerService,
                              OrdersService ordersService,
                              WorkExperienceService workExperienceService,
                              OrdersMapper ordersMapper,
                              WorkExperienceMapper workExperienceMapper) {
        this.service = service;
        this.mapper = mapper;
        this.portfolioService = portfolioService;
        this.customerService = customerService;
        this.ordersService = ordersService;
        this.workExperienceService = workExperienceService;
        this.ordersMapper = ordersMapper;
        this.workExperienceMapper = workExperienceMapper;
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

    @PutMapping("/chats/{chatId}/read")
    public ResponseEntity<?> markChatAsRead(@PathVariable Integer chatId) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            service.markChatAsRead(accountId, chatId);
            return ResponseEntity.ok().build();
        } catch (NotFoundException e) {
            logger.error("Chat or performer not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            logger.error("Access denied: {}", e.getMessage());
            return ResponseEntity.status(403).build();
        } catch (Exception e) {
            logger.error("Error marking chat as read: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
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
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
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
            
            // Создаем Map с данными портфолио и добавляем ФИО из Performer
            // Используем простые геттеры, чтобы избежать ленивой загрузки
            Map<String, Object> portfolioData = new java.util.HashMap<>();
            if (portfolio != null) {
                portfolioData.put("id", portfolio.getId());
                portfolioData.put("name", portfolio.getName());
                portfolioData.put("phone", portfolio.getPhone());
                portfolioData.put("email", portfolio.getEmail());
                portfolioData.put("townCountry", portfolio.getTownCountry());
                portfolioData.put("specializations", portfolio.getSpecializations());
                portfolioData.put("employment", portfolio.getEmployment());
                portfolioData.put("experience", portfolio.getExperience());
                portfolioData.put("isActive", portfolio.getIsActive());
            }
            // Добавляем ФИО из Performer (простые поля, не ленивые связи)
            portfolioData.put("lastName", performer.getLastName());
            portfolioData.put("firstName", performer.getFirstName());
            portfolioData.put("middleName", performer.getMiddleName());
            
            return ResponseEntity.ok(portfolioData);
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

    @GetMapping("/customer/{customerId}/info")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<?> getCustomerInfo(@PathVariable Integer customerId) {
        try {
            Integer currentAccountId = SecurityUtils.getCurrentUserId();
            if (currentAccountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            // Ищем заказчика по customerId (в DTO теперь приходит customer.id)
            Optional<Customer> customerOpt = customerService.findByIdWithAccount(customerId);
            if (customerOpt.isEmpty()) {
                logger.error("Customer not found for customerId: {}", customerId);
                return ResponseEntity.notFound().build();
            }
            
            Customer customer = customerOpt.get();
            
            if (customer.getAccount() == null) {
                logger.error("Customer account is null for customerId: {}", customerId);
                return ResponseEntity.notFound().build();
            }
            
            // Загружаем Role явно, чтобы избежать проблем с lazy loading
            Account account = customer.getAccount();
            Role role = account.getRole();
            
            // Создаем простой DTO для ответа, чтобы избежать проблем с сериализацией
            Map<String, Object> accountInfo = new java.util.HashMap<>();
            accountInfo.put("id", account.getId());
            accountInfo.put("email", account.getEmail() != null ? account.getEmail() : "");
            accountInfo.put("email", account.getEmail() != null ? account.getEmail() : "");
            
            if (role != null) {
                Map<String, Object> roleInfo = new java.util.HashMap<>();
                roleInfo.put("id", role.getId());
                roleInfo.put("name", role.getName() != null ? role.getName() : "");
                accountInfo.put("role", roleInfo);
            } else {
                accountInfo.put("role", new java.util.HashMap<>());
            }
            
            return ResponseEntity.ok(accountInfo);
        } catch (NotFoundException e) {
            logger.error("Customer not found for customerId: {}", customerId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting customer info: {}", e.getMessage(), e);
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get customer info: " + e.getMessage()));
        }
    }

    @GetMapping("/customer/{customerId}/portfolio")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<?> getCustomerPortfolio(@PathVariable Integer customerId) {
        try {
            Integer currentAccountId = SecurityUtils.getCurrentUserId();
            if (currentAccountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            // Ищем заказчика по customerId (в DTO теперь приходит customer.id)
            Customer customer = customerService.findByIdWithAccount(customerId)
                    .orElseThrow(() -> new NotFoundException("Customer", customerId));
            
            // Преобразуем Customer в CustomerPortfolio DTO
            Map<String, Object> portfolio = new java.util.HashMap<>();
            portfolio.put("id", customer.getId());
            portfolio.put("name", customer.getFullName() != null ? customer.getFullName() : "");
            portfolio.put("lastName", customer.getLastName());
            portfolio.put("firstName", customer.getFirstName());
            portfolio.put("middleName", customer.getMiddleName());
            portfolio.put("email", customer.getEmail() != null ? customer.getEmail() : "");
            // phone, description, scopeS теперь получаются из Portfolio
            List<Portfolio> customerPortfolios = portfolioService.findByUserId(customer.getId(), "CUSTOMER");
            if (!customerPortfolios.isEmpty()) {
                Portfolio customerPortfolio = customerPortfolios.get(0);
                portfolio.put("phone", customerPortfolio.getPhone() != null ? customerPortfolio.getPhone() : "");
                portfolio.put("description", customerPortfolio.getDescription() != null ? customerPortfolio.getDescription() : "");
                portfolio.put("scopeS", customerPortfolio.getScopeS() != null ? customerPortfolio.getScopeS() : "");
            } else {
                portfolio.put("phone", "");
                portfolio.put("description", "");
                portfolio.put("scopeS", "");
            }
            
            return ResponseEntity.ok(portfolio);
        } catch (NotFoundException e) {
            logger.error("Customer not found for customerId: {}", customerId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting customer portfolio: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get customer portfolio"));
        }
    }

    @GetMapping("/customer/{customerId}/done-orders")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getCustomerDoneOrders(@PathVariable Integer customerId) {
        try {
            Integer currentAccountId = SecurityUtils.getCurrentUserId();
            if (currentAccountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            // Ищем заказчика по customerId (в DTO теперь приходит customer.id)
            Customer customer = customerService.findById(customerId)
                    .orElseThrow(() -> new NotFoundException("Customer", customerId));
            
            java.util.List<Orders> orders = ordersService.findByCustomerId(customer.getId());
            java.util.List<AddOrderDto> doneOrders = orders.stream()
                    .filter(o -> o.getStatus() == com.fomov.tasktroveapi.model.OrderStatus.DONE)
                    .map(ordersMapper::toDto)
                    .toList();
            
            return ResponseEntity.ok(Map.of("orders", doneOrders));
        } catch (NotFoundException e) {
            logger.error("Customer not found for customerId: {}", customerId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting customer done orders: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/customer/{customerId}/reviews")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getCustomerReviews(@PathVariable Integer customerId) {
        try {
            Integer currentAccountId = SecurityUtils.getCurrentUserId();
            if (currentAccountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            // Ищем заказчика по customerId (в DTO теперь приходит customer.id)
            Customer customer = customerService.findByIdWithAccount(customerId)
                    .orElseThrow(() -> new NotFoundException("Customer", customerId));
            
            // Получаем accountId заказчика, о котором отзыв
            Integer customerAccountId = null;
            if (customer.getAccount() != null) {
                customerAccountId = customer.getAccount().getId();
            }
            
            // Получаем только отзывы О заказчике от исполнителей (reviewerType = PERFORMER)
            java.util.List<WorkExperience> reviews = workExperienceService.findReviewsAboutCustomer(customer.getId());
            java.util.List<WorkExperienceDto> reviewDtos = reviews.stream()
                    .map(workExperienceMapper::toDto)
                    .toList();
            
            return ResponseEntity.ok(Map.of("reviews", reviewDtos));
        } catch (NotFoundException e) {
            logger.error("Customer not found for customerId: {}", customerId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting customer reviews: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/addreview")
    public ResponseEntity<?> addReview(@RequestBody @Validated WorkExperienceDto dto) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            service.addReview(accountId, dto);
            return ResponseEntity.ok().build();
        } catch (NotFoundException e) {
            logger.error("Performer or customer not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error adding review: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
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

    @GetMapping("/top-performers")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getTopPerformers() {
        try {
            List<Performer> performers = service.getTopPerformers();
            List<Map<String, Object>> performerDtos = performers.stream()
                    .map(performer -> {
                        // Рассчитываем рейтинг на основе отзывов
                        List<WorkExperience> reviews = workExperienceService.findReviewsAboutPerformer(performer.getId());
                        int calculatedRating = 0;
                        if (!reviews.isEmpty()) {
                            double averageMark = reviews.stream()
                                    .mapToInt(review -> review.getRate() != null ? review.getRate() : 0)
                                    .average()
                                    .orElse(0.0);
                            // Преобразуем среднюю оценку (1-5) в рейтинг (0-100)
                            calculatedRating = (int) Math.round(averageMark * 20);
                        }
                        
                        // Подсчитываем количество выполненных заказов
                        List<Orders> allOrders = ordersService.findByPerformerId(performer.getId());
                        long completedOrdersCount = allOrders.stream()
                                .filter(order -> order.getStatus() == com.fomov.tasktroveapi.model.OrderStatus.DONE)
                                .count();
                        
                        Map<String, Object> dto = new java.util.HashMap<>();
                        dto.put("id", performer.getId());
                        dto.put("lastName", performer.getLastName());
                        dto.put("firstName", performer.getFirstName());
                        dto.put("middleName", performer.getMiddleName());
                        dto.put("fullName", performer.getFullName());
                        dto.put("email", performer.getEmail());
                        dto.put("rating", calculatedRating);
                        dto.put("completedOrdersCount", completedOrdersCount);
                        return dto;
                    })
                    .sorted((a, b) -> Integer.compare((Integer) b.get("rating"), (Integer) a.get("rating")))
                    .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(Map.of("performers", performerDtos));
        } catch (Exception e) {
            logger.error("Error getting top performers: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get top performers"));
        }
    }
}


