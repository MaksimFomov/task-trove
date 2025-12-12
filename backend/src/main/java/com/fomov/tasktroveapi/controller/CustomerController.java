package com.fomov.tasktroveapi.controller;

import com.fomov.tasktroveapi.dto.*;
import com.fomov.tasktroveapi.exception.NotFoundException;
import com.fomov.tasktroveapi.model.*;
import com.fomov.tasktroveapi.repository.AccountRepository;
import com.fomov.tasktroveapi.security.SecurityUtils;
import com.fomov.tasktroveapi.service.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
@PreAuthorize("hasRole('Customer')")
public class CustomerController {

    private static final Logger logger = LoggerFactory.getLogger(CustomerController.class);

    private final CustomerService customerService;
    private final PortfolioService portfolioService;
    private final AccountRepository accountRepository;
    private final OrdersService ordersService;
    private final WorkExperienceService workExperienceService;
    private final PerformerService performerService;
    private final com.fomov.tasktroveapi.mapper.OrdersMapper ordersMapper;
    private final com.fomov.tasktroveapi.mapper.WorkExperienceMapper workExperienceMapper;

    public CustomerController(CustomerService customerService,
                             PortfolioService portfolioService,
                             AccountRepository accountRepository,
                             OrdersService ordersService,
                             WorkExperienceService workExperienceService,
                             PerformerService performerService,
                             com.fomov.tasktroveapi.mapper.OrdersMapper ordersMapper,
                             com.fomov.tasktroveapi.mapper.WorkExperienceMapper workExperienceMapper) {
        this.customerService = customerService;
        this.portfolioService = portfolioService;
        this.accountRepository = accountRepository;
        this.ordersService = ordersService;
        this.workExperienceService = workExperienceService;
        this.performerService = performerService;
        this.ordersMapper = ordersMapper;
        this.workExperienceMapper = workExperienceMapper;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listOrders(@RequestParam(value = "searchTerm", required = false) String searchTerm) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            Map<String, Object> result = customerService.getCustomerOrders(accountId, searchTerm);
            return ResponseEntity.ok(result);
        } catch (NotFoundException e) {
            logger.error("Customer not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error listing orders: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<AddOrderDto> getOrder(@PathVariable Integer id) {
        try {
            AddOrderDto dto = customerService.getOrderWithReplies(id);
            return ResponseEntity.ok(dto);
        } catch (NotFoundException e) {
            logger.error("Order not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting order: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/done")
    public ResponseEntity<Map<String, Object>> done() {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            Map<String, Object> result = customerService.getDoneOrders(accountId);
            return ResponseEntity.ok(result);
        } catch (NotFoundException e) {
            logger.error("Customer not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting done orders: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
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
            
            Map<String, Object> result = customerService.getCustomerChats(accountId, tab);
            return ResponseEntity.ok(result);
        } catch (NotFoundException e) {
            logger.error("Customer not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting chats: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
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
            
            Map<String, Object> result = customerService.getChatMessages(accountId, chatId);
            return ResponseEntity.ok(result);
        } catch (NotFoundException e) {
            logger.error("Chat or customer not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            logger.error("Access denied: {}", e.getMessage());
            return ResponseEntity.status(403).build();
        } catch (Exception e) {
            logger.error("Error getting messages: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/chats/{chatId}/read")
    public ResponseEntity<?> markChatAsRead(@PathVariable Integer chatId) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            customerService.markChatAsRead(accountId, chatId);
            return ResponseEntity.ok().build();
        } catch (NotFoundException e) {
            logger.error("Chat or customer not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            logger.error("Access denied: {}", e.getMessage());
            return ResponseEntity.status(403).build();
        } catch (Exception e) {
            logger.error("Error marking chat as read: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/addorder")
    public ResponseEntity<?> addOrder(@RequestBody AddOrderDto dto) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            customerService.createOrder(accountId, dto);
            return ResponseEntity.ok().build();
        } catch (NotFoundException e) {
            logger.error("Customer not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error creating order: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/orders/{orderId}")
    public ResponseEntity<?> updateOrder(@PathVariable Integer orderId, @RequestBody AddOrderDto dto) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            customerService.updateOrder(accountId, orderId, dto);
            return ResponseEntity.ok().build();
        } catch (NotFoundException e) {
            logger.error("Order or customer not found: {}", e.getMessage());
            return ResponseEntity.status(404).build();
        } catch (SecurityException e) {
            logger.error("Access denied: {}", e.getMessage());
            return ResponseEntity.status(403).build();
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid argument: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating order: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/deleteorder")
    public ResponseEntity<?> deleteOrder(@RequestParam("orderId") Integer orderId) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            customerService.deleteOrder(accountId, orderId);
            return ResponseEntity.ok().build();
        } catch (NotFoundException e) {
            logger.error("Order or customer not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            logger.error("Access denied: {}", e.getMessage());
            return ResponseEntity.status(403).build();
        } catch (IllegalStateException e) {
            logger.warn("Invalid state: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error deleting order: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/deleteorder/{orderId}")
    public ResponseEntity<?> permanentlyDeleteOrder(@PathVariable Integer orderId) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            customerService.permanentlyDeleteOrder(accountId, orderId);
            return ResponseEntity.noContent().build();
        } catch (NotFoundException e) {
            logger.error("Order or customer not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            logger.error("Access denied: {}", e.getMessage());
            return ResponseEntity.status(403).build();
        } catch (Exception e) {
            logger.error("Error permanently deleting order: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/addperformertoorder")
    public ResponseEntity<?> addPerformerToOrder(@RequestBody AddPerformerToOrderDto dto) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            customerService.assignPerformerToOrder(accountId, dto);
            return ResponseEntity.ok().build();
        } catch (NotFoundException e) {
            logger.error("Resource not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            logger.error("Access denied: {}", e.getMessage());
            return ResponseEntity.status(403).build();
        } catch (Exception e) {
            logger.error("Error assigning performer: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/readytask")
    public ResponseEntity<?> updateTaskStatus(@RequestBody ReadyOrderDto dto) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            customerService.updateOrderStatus(accountId, dto);
            return ResponseEntity.noContent().build();
        } catch (NotFoundException e) {
            logger.error("Order or customer not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            logger.error("Access denied: {}", e.getMessage());
            return ResponseEntity.status(403).build();
        } catch (Exception e) {
            logger.error("Error updating order status: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/addreview")
    public ResponseEntity<?> addReview(@RequestBody WorkExperienceDto dto) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            customerService.addReview(accountId, dto);
            return ResponseEntity.ok().build();
        } catch (NotFoundException e) {
            logger.error("Customer or performer not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error adding review: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/sendemail")
    public ResponseEntity<?> sendEmail(
            @RequestParam(value = "orderId", required = false) Integer orderId,
            @RequestParam(value = "performerId", required = false) Integer performerId,
            @RequestParam(value = "text", required = false) String text,
            @RequestParam(value = "document", required = false) MultipartFile document,
            @RequestParam(value = "isCorrection", required = false, defaultValue = "false") Boolean isCorrection) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            customerService.sendEmailToPerformer(accountId, orderId, performerId, text, document, isCorrection);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            logger.error("Error sending email: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Failed to send email: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error sending email: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/portfolio")
    public ResponseEntity<?> getPortfolio() {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            Customer customer = customerService.getPortfolio(accountId);
            return ResponseEntity.ok(customer);
        } catch (NotFoundException e) {
            logger.error("Customer not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting portfolio: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/portfolio")
    public ResponseEntity<?> updatePortfolio(@RequestBody @Validated UpdateCustomerPortfolioDto dto) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            customerService.updatePortfolio(accountId, dto);
            return ResponseEntity.ok().build();
        } catch (NotFoundException e) {
            logger.error("Customer not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error updating portfolio: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/reviews")
    public ResponseEntity<Map<String, Object>> getMyReviews() {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            Map<String, Object> result = customerService.getMyReviews(accountId);
            return ResponseEntity.ok(result);
        } catch (NotFoundException e) {
            logger.error("Customer not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting reviews: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/info")
    public ResponseEntity<?> getInfo(@RequestParam("userId") Integer userId) {
        try {
            Integer currentUserId = SecurityUtils.getCurrentUserId();
            if (currentUserId == null) {
                return ResponseEntity.status(401).build();
            }
            
            return accountRepository.findById(userId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error getting account info: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/performer/{accountId}/done-orders")
    public ResponseEntity<Map<String, Object>> getPerformerDoneOrders(@PathVariable Integer accountId) {
        try {
            Integer currentAccountId = SecurityUtils.getCurrentUserId();
            if (currentAccountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            // Ищем исполнителя по accountId (так как в DTO приходит accountId)
            Performer performer = performerService.findByAccountId(accountId)
                    .orElseThrow(() -> new NotFoundException("Performer with accountId", accountId));
            
            List<Orders> orders = ordersService.findByPerformerId(performer.getId());
            List<AddOrderDto> doneOrders = orders.stream()
                    .filter(o -> Boolean.TRUE.equals(o.getIsDone()))
                    .map(ordersMapper::toDto)
                    .toList();
            
            return ResponseEntity.ok(Map.of("orders", doneOrders));
        } catch (NotFoundException e) {
            logger.error("Performer not found for accountId: {}", accountId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting performer done orders: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/performer/{accountId}/reviews")
    public ResponseEntity<Map<String, Object>> getPerformerReviews(@PathVariable Integer accountId) {
        try {
            Integer currentAccountId = SecurityUtils.getCurrentUserId();
            if (currentAccountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            // Ищем исполнителя по accountId (так как в DTO приходит accountId)
            Performer performer = performerService.findByAccountId(accountId)
                    .orElseThrow(() -> new NotFoundException("Performer with accountId", accountId));
            
            // Получаем только отзывы О исполнителе от заказчиков (reviewerType = CUSTOMER)
            List<WorkExperience> reviews = workExperienceService.findReviewsAboutPerformer(performer.getId());
            List<WorkExperienceDto> reviewDtos = reviews.stream()
                    .map(workExperienceMapper::toDto)
                    .toList();
            
            return ResponseEntity.ok(Map.of("reviews", reviewDtos));
        } catch (NotFoundException e) {
            logger.error("Performer not found for accountId: {}", accountId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting performer reviews: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/performer/{accountId}/portfolio")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<?> getPerformerPortfolio(@PathVariable Integer accountId) {
        try {
            Integer currentAccountId = SecurityUtils.getCurrentUserId();
            if (currentAccountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            // Ищем исполнителя по accountId (так как в DTO приходит accountId)
            Performer performer = performerService.findByAccountId(accountId)
                    .orElseThrow(() -> new NotFoundException("Performer with accountId", accountId));
            
            // Получаем портфолио исполнителя
            List<Portfolio> portfolios = portfolioService.findByUserId(performer.getId());
            Portfolio portfolio = portfolios.isEmpty() ? null : portfolios.get(0);
            
            if (portfolio == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Создаем Map с данными портфолио и добавляем ФИО из Performer
            // Используем простые геттеры, чтобы избежать ленивой загрузки
            Map<String, Object> portfolioData = new java.util.HashMap<>();
            portfolioData.put("id", portfolio.getId());
            portfolioData.put("name", portfolio.getName());
            portfolioData.put("phone", portfolio.getPhone());
            portfolioData.put("email", portfolio.getEmail());
            portfolioData.put("townCountry", portfolio.getTownCountry());
            portfolioData.put("specializations", portfolio.getSpecializations());
            portfolioData.put("employment", portfolio.getEmployment());
            portfolioData.put("experience", portfolio.getExperience());
            portfolioData.put("isActive", portfolio.getIsActive());
            // Добавляем ФИО из Performer (простые поля, не ленивые связи)
            portfolioData.put("lastName", performer.getLastName());
            portfolioData.put("firstName", performer.getFirstName());
            portfolioData.put("middleName", performer.getMiddleName());
            
            return ResponseEntity.ok(portfolioData);
        } catch (NotFoundException e) {
            logger.error("Performer not found for accountId: {}", accountId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting performer portfolio: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get performer portfolio"));
        }
    }

    @PostMapping("/refuse-performer/{orderId}")
    public ResponseEntity<?> refusePerformer(@PathVariable Integer orderId) {
        try {
            Integer accountId = SecurityUtils.getCurrentUserId();
            if (accountId == null) {
                return ResponseEntity.status(401).build();
            }
            
            customerService.refusePerformer(accountId, orderId);
            return ResponseEntity.ok().build();
        } catch (NotFoundException e) {
            logger.error("Resource not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            logger.error("Access denied: {}", e.getMessage());
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (IllegalStateException e) {
            logger.error("Invalid state: {}", e.getMessage());
            return ResponseEntity.status(400).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error refusing performer: {}", e.getMessage(), e);
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
            
            customerService.deleteChat(accountId, chatId);
            return ResponseEntity.ok().build();
        } catch (NotFoundException e) {
            logger.error("Chat or customer not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            logger.error("Access denied: {}", e.getMessage());
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            logger.error("Invalid state: {}", e.getMessage());
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error deleting chat: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}


