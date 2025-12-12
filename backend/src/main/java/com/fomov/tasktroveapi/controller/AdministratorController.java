package com.fomov.tasktroveapi.controller;

import com.fomov.tasktroveapi.dto.RegistrationAccDto;
import com.fomov.tasktroveapi.dto.RegistrationCustDto;
import com.fomov.tasktroveapi.dto.AddOrderDto;
import com.fomov.tasktroveapi.mapper.OrdersMapper;
import com.fomov.tasktroveapi.model.*;
import com.fomov.tasktroveapi.service.AdministratorService;
import com.fomov.tasktroveapi.service.PortfolioService;
import com.fomov.tasktroveapi.service.RegistrationService;
import com.fomov.tasktroveapi.service.OrdersService;
import com.fomov.tasktroveapi.service.CustomerService;
import com.fomov.tasktroveapi.service.PerformerService;
import com.fomov.tasktroveapi.service.WorkExperienceService;
import com.fomov.tasktroveapi.service.NotificationService;
import com.fomov.tasktroveapi.dto.WorkExperienceDto;
import com.fomov.tasktroveapi.mapper.WorkExperienceMapper;
import com.fomov.tasktroveapi.exception.NotFoundException;
import com.fomov.tasktroveapi.security.SecurityUtils;
import com.fomov.tasktroveapi.repository.AccountRepository;
import com.fomov.tasktroveapi.repository.ReplyRepository;
import com.fomov.tasktroveapi.repository.CustomerRepository;
import com.fomov.tasktroveapi.repository.PerformerRepository;
import com.fomov.tasktroveapi.repository.AdministratorRepository;
import com.fomov.tasktroveapi.repository.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/administrators", "/api/admin"})
@PreAuthorize("hasRole('Administrator') or hasRole('SuperAdministrator')")
public class AdministratorController {

    private static final Logger logger = LoggerFactory.getLogger(AdministratorController.class);

    private final AdministratorService service;
    private final PortfolioService portfolioService;
    private final AccountRepository accountRepository;
    private final ReplyRepository replyRepository;
    private final RegistrationService registrationService;
    private final OrdersService ordersService;
    private final CustomerRepository customerRepository;
    private final PerformerRepository performerRepository;
    private final AdministratorRepository administratorRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final OrdersMapper ordersMapper;
    private final CustomerService customerService;
    private final PerformerService performerService;
    private final WorkExperienceService workExperienceService;
    private final WorkExperienceMapper workExperienceMapper;
    private final NotificationService notificationService;

    public AdministratorController(AdministratorService service, 
                                 PortfolioService portfolioService, 
                                 AccountRepository accountRepository, 
                                 ReplyRepository replyRepository,
                                 RegistrationService registrationService,
                                 OrdersService ordersService,
                                 CustomerRepository customerRepository,
                                 PerformerRepository performerRepository,
                                 AdministratorRepository administratorRepository,
                                 RoleRepository roleRepository,
                                 PasswordEncoder passwordEncoder,
                                 OrdersMapper ordersMapper,
                                 CustomerService customerService,
                                 PerformerService performerService,
                                 WorkExperienceService workExperienceService,
                                 WorkExperienceMapper workExperienceMapper,
                                 NotificationService notificationService) {
        this.service = service;
        this.portfolioService = portfolioService;
        this.accountRepository = accountRepository;
        this.replyRepository = replyRepository;
        this.registrationService = registrationService;
        this.ordersService = ordersService;
        this.customerRepository = customerRepository;
        this.performerRepository = performerRepository;
        this.administratorRepository = administratorRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.ordersMapper = ordersMapper;
        this.customerService = customerService;
        this.performerService = performerService;
        this.workExperienceService = workExperienceService;
        this.workExperienceMapper = workExperienceMapper;
        this.notificationService = notificationService;
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
    @Transactional(readOnly = true)
    public ResponseEntity<?> getPortfolio(@RequestParam("userId") Integer userId) {
        try {
            // Получаем исполнителя для доступа к ФИО (используем findByIdWithAccount для загрузки всех данных)
            Performer performer = performerService.findByIdWithAccount(userId)
                    .orElseThrow(() -> new NotFoundException("Performer", userId));
            
            // Получаем портфолио исполнителя
            List<Portfolio> portfolios = portfolioService.findByUserId(userId);
            
            // Если портфолио нет, создаем пустой объект с ФИО
            if (portfolios.isEmpty()) {
                Map<String, Object> emptyPortfolio = new HashMap<>();
                emptyPortfolio.put("id", null);
                emptyPortfolio.put("name", null);
                emptyPortfolio.put("phone", null);
                emptyPortfolio.put("email", performer.getEmail());
                emptyPortfolio.put("townCountry", null);
                emptyPortfolio.put("specializations", null);
                emptyPortfolio.put("employment", null);
                emptyPortfolio.put("experience", null);
                emptyPortfolio.put("isActive", false);
                // Добавляем ФИО из Performer (простые поля, не ленивые связи)
                emptyPortfolio.put("lastName", performer.getLastName());
                emptyPortfolio.put("firstName", performer.getFirstName());
                emptyPortfolio.put("middleName", performer.getMiddleName());
                return ResponseEntity.ok(java.util.Collections.singletonList(emptyPortfolio));
            }
            
            // Преобразуем список портфолио в список Map с добавлением ФИО
            // Используем простые геттеры, чтобы избежать ленивой загрузки
            List<Map<String, Object>> portfolioDataList = portfolios.stream()
                    .map(portfolio -> {
                        Map<String, Object> portfolioData = new HashMap<>();
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
                        return portfolioData;
                    })
                    .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(portfolioDataList);
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting portfolio: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get portfolio"));
        }
    }

    @GetMapping("/getusers")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getUsers() {
        List<Account> accounts = accountRepository.findAllWithRole();
        List<Map<String, Object>> users = accounts.stream()
                .map(account -> {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("id", account.getId());
                    userMap.put("login", account.getLogin());
                    userMap.put("email", account.getEmail());
                    userMap.put("isActive", account.getIsActive());
                    // Явно добавляем роль, так как она игнорируется @JsonIgnore
                    if (account.getRole() != null) {
                        userMap.put("role", Map.of(
                            "id", account.getRole().getId(),
                            "name", account.getRole().getName()
                        ));
                    }
                    return userMap;
                })
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(Map.of("users", users));
    }

    @GetMapping("/info")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getInfo(@RequestParam("userId") Integer userId) {
        Optional<Account> accountOpt = accountRepository.findByIdWithRole(userId);
        if (accountOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Account account = accountOpt.get();
        Map<String, Object> accountData = new HashMap<>();
        accountData.put("id", account.getId());
        accountData.put("login", account.getLogin());
        accountData.put("email", account.getEmail());
        accountData.put("isActive", account.getIsActive());
        // Явно добавляем роль, так как она игнорируется @JsonIgnore
        if (account.getRole() != null) {
            accountData.put("role", Map.of(
                "id", account.getRole().getId(),
                "name", account.getRole().getName()
            ));
        }
        
        return ResponseEntity.ok(accountData);
    }

    @PostMapping("/activate")
    public ResponseEntity<?> activate(@RequestParam("userId") Integer userId) {
        Optional<Account> accountOpt = accountRepository.findById(userId);
        if (accountOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Account account = accountOpt.get();
        account.setIsActive(true);
        accountRepository.save(account);
        return ResponseEntity.ok(Map.of("success", true, "message", "User activated successfully"));
    }

    @PostMapping("/disactivate")
    public ResponseEntity<?> disactivate(@RequestParam("userId") Integer userId) {
        Optional<Account> accountOpt = accountRepository.findById(userId);
        if (accountOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Account account = accountOpt.get();
        account.setIsActive(false);
        accountRepository.save(account);
        return ResponseEntity.ok(Map.of("success", true, "message", "User deactivated successfully"));
    }

    @DeleteMapping("/deletecomment")
    public ResponseEntity<?> deleteComment(@RequestParam("id") Integer id) {
        replyRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ========== User Management ==========

    @PostMapping("/users/create-customer")
    @Transactional
    public ResponseEntity<?> createCustomer(@RequestBody RegistrationCustDto dto) {
        try {
            Customer customer = registrationService.registerCustomer(dto);
            return ResponseEntity.ok(Map.of("success", true, "message", "Customer created successfully", "id", customer.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/users/create-performer")
    @Transactional
    public ResponseEntity<?> createPerformer(@RequestBody RegistrationAccDto dto) {
        try {
            Performer performer = registrationService.registerPerformer(dto);
            return ResponseEntity.ok(Map.of("success", true, "message", "Performer created successfully", "id", performer.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/users/create-administrator")
    @Transactional
    public ResponseEntity<?> createAdministrator(@RequestBody Map<String, String> dto) {
        try {
            // Проверка прав: только суперадмин может создавать администраторов
            if (!isSuperAdmin()) {
                return ResponseEntity.status(403).body(Map.of(
                    "success", false, 
                    "error", "Только суперадмин может создавать администраторов"
                ));
            }
            
            String login = dto.get("login");
            String password = dto.get("password");
            String name = dto.get("name");
            
            if (login == null || password == null || name == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Login, password and name are required"));
            }
            
            String normalizedLogin = login.trim().toLowerCase();
            
            // Проверяем, существует ли логин
            if (accountRepository.findByLogin(normalizedLogin).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Логин уже существует"));
            }
            
            // Проверяем, существует ли email (логин используется как email)
            if (accountRepository.findByEmail(normalizedLogin).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Логин уже существует"));
            }
            
            Role adminRole = roleRepository.findByName("Administrator")
                    .orElseThrow(() -> new RuntimeException("Administrator role not found"));
            
            Account account = new Account();
            account.setLogin(normalizedLogin);
            account.setEmail(normalizedLogin); // Используем логин как email
            account.setPassword(passwordEncoder.encode(password));
            account.setRole(adminRole);
            account.setIsActive(true);
            account = accountRepository.save(account);
            
            Administrator administrator = new Administrator();
            administrator.setAccount(account);
            administrator.setName(name);
            administrator.setEmail(normalizedLogin); // Используем логин как email
            administrator = administratorRepository.save(administrator);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Administrator created successfully", "id", administrator.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Проверяет, является ли текущий пользователь суперадмином
     * Суперадмин - это пользователь с ролью "SuperAdministrator"
     */
    private boolean isSuperAdmin() {
        Integer currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            return false;
        }
        return accountRepository.findByIdWithRole(currentUserId)
                .map(Account::getRole)
                .map(Role::getName)
                .map(roleName -> "SuperAdministrator".equals(roleName))
                .orElse(false);
    }

    @PutMapping("/users/{userId}")
    @Transactional
    public ResponseEntity<?> updateUser(@PathVariable Integer userId, @RequestBody Map<String, Object> updates) {
        try {
            Optional<Account> accountOpt = accountRepository.findById(userId);
            if (accountOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Account account = accountOpt.get();
            
            // Проверка прав: если редактируемый пользователь - администратор (обычный или суперадмин), 
            // то редактировать может только суперадмин
            String targetUserRole = account.getRole().getName();
            if ("Administrator".equals(targetUserRole) || "SuperAdministrator".equals(targetUserRole)) {
                if (!isSuperAdmin()) {
                    return ResponseEntity.status(403).body(Map.of(
                        "success", false, 
                        "error", "Только суперадмин может редактировать других администраторов"
                    ));
                }
            }
            
            // Update email/login if provided
            if ("Administrator".equals(targetUserRole) || "SuperAdministrator".equals(targetUserRole)) {
                // Для администраторов обновляем login
                if (updates.containsKey("login")) {
                    String newLogin = ((String) updates.get("login")).trim().toLowerCase();
                    if (!newLogin.equals(account.getLogin()) && accountRepository.findByLogin(newLogin).isPresent()) {
                        return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Логин уже существует"));
                    }
                    if (!newLogin.equals(account.getEmail()) && accountRepository.findByEmail(newLogin).isPresent()) {
                        return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Логин уже существует"));
                    }
                    account.setLogin(newLogin);
                    account.setEmail(newLogin); // Логин используется как email
                }
            } else {
                // Для остальных обновляем email
            if (updates.containsKey("email")) {
                String newEmail = ((String) updates.get("email")).trim().toLowerCase();
                if (!newEmail.equals(account.getEmail()) && accountRepository.findByEmail(newEmail).isPresent()) {
                    return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Email already exists"));
                }
                account.setEmail(newEmail);
                account.setLogin(newEmail);
                }
            }
            
            // Update password if provided
            if (updates.containsKey("password") && updates.get("password") != null) {
                String newPassword = (String) updates.get("password");
                if (!newPassword.isEmpty()) {
                    account.setPassword(passwordEncoder.encode(newPassword));
                }
            }
            
            // Update role if provided
            if (updates.containsKey("roleName")) {
                String roleName = (String) updates.get("roleName");
                Role newRole = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
                account.setRole(newRole);
            }
            
            accountRepository.save(account);
            
            // Update user-specific data
            String roleName = account.getRole().getName();
                if ("Customer".equals(roleName)) {
                    customerRepository.findByAccountId(userId).ifPresent(customer -> {
                    if (updates.containsKey("lastName")) {
                        customer.setLastName((String) updates.get("lastName"));
                    }
                    if (updates.containsKey("firstName")) {
                        customer.setFirstName((String) updates.get("firstName"));
                    }
                    if (updates.containsKey("middleName")) {
                        customer.setMiddleName((String) updates.get("middleName"));
                    }
                    if (updates.containsKey("phone")) {
                        customer.setPhone((String) updates.get("phone"));
                    }
                    if (updates.containsKey("description")) {
                        customer.setDescription((String) updates.get("description"));
                    }
                    if (updates.containsKey("scopeS")) {
                        customer.setScopeS((String) updates.get("scopeS"));
                    }
                        customerRepository.save(customer);
                    });
                } else if ("Performer".equals(roleName)) {
                    performerRepository.findByAccountId(userId).ifPresent(performer -> {
                    if (updates.containsKey("lastName")) {
                        performer.setLastName((String) updates.get("lastName"));
                    }
                    if (updates.containsKey("firstName")) {
                        performer.setFirstName((String) updates.get("firstName"));
                    }
                    if (updates.containsKey("middleName")) {
                        performer.setMiddleName((String) updates.get("middleName"));
                    }
                    if (updates.containsKey("age")) {
                        Object ageObj = updates.get("age");
                        if (ageObj != null) {
                            performer.setAge(ageObj instanceof Number ? ((Number) ageObj).intValue() : Integer.parseInt(ageObj.toString()));
                        }
                    }
                        performerRepository.save(performer);
                    
                    // Update portfolio if exists
                    List<Portfolio> portfolios = portfolioService.findByUserId(performer.getId());
                    if (!portfolios.isEmpty()) {
                        Portfolio portfolio = portfolios.get(0);
                        if (updates.containsKey("phone")) {
                            portfolio.setPhone((String) updates.get("phone"));
                        }
                        if (updates.containsKey("townCountry")) {
                            portfolio.setTownCountry((String) updates.get("townCountry"));
                        }
                        if (updates.containsKey("specializations")) {
                            portfolio.setSpecializations((String) updates.get("specializations"));
                        }
                        if (updates.containsKey("employment")) {
                            portfolio.setEmployment((String) updates.get("employment"));
                        }
                        if (updates.containsKey("experience")) {
                            portfolio.setExperience((String) updates.get("experience"));
                        }
                        portfolioService.save(portfolio);
                    }
                    });
            } else if ("Administrator".equals(roleName) || "SuperAdministrator".equals(roleName)) {
                    administratorRepository.findByAccountId(userId).ifPresent(admin -> {
                    if (updates.containsKey("name")) {
                        admin.setName((String) updates.get("name"));
                    }
                        administratorRepository.save(admin);
                    });
            }
            
            return ResponseEntity.ok(Map.of("success", true, "message", "User updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @DeleteMapping("/users/{userId}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Integer userId) {
        try {
            Optional<Account> accountOpt = accountRepository.findById(userId);
            if (accountOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Account account = accountOpt.get();
            String roleName = account.getRole().getName();
            
            // Проверка прав: если удаляемый пользователь - администратор (обычный или суперадмин), 
            // то удалять может только суперадмин
            if ("Administrator".equals(roleName) || "SuperAdministrator".equals(roleName)) {
                if (!isSuperAdmin()) {
                    return ResponseEntity.status(403).body(Map.of(
                        "success", false, 
                        "error", "Только суперадмин может удалять других администраторов"
                    ));
                }
            }
            
            // Delete user-specific entity first
            if ("Customer".equals(roleName)) {
                customerRepository.findByAccountId(userId).ifPresent(customerRepository::delete);
            } else if ("Performer".equals(roleName)) {
                performerRepository.findByAccountId(userId).ifPresent(performerRepository::delete);
            } else if ("Administrator".equals(roleName)) {
                administratorRepository.findByAccountId(userId).ifPresent(administratorRepository::delete);
            }
            
            // Delete account
            accountRepository.deleteById(userId);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "User deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/users/{userId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getUserDetails(@PathVariable Integer userId) {
        try {
            // Используем метод, который загружает роль
            Optional<Account> accountOpt = accountRepository.findByIdWithRole(userId);
            if (accountOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Account account = accountOpt.get();
            Role role = account.getRole();
            
            if (role == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Role not found for user"));
            }
            
            String roleName = role.getName();
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", account.getId());
            userData.put("login", account.getLogin());
            userData.put("email", account.getEmail());
            userData.put("isActive", account.getIsActive());
            userData.put("role", Map.of("id", role.getId(), "name", role.getName()));
            
            // Add role-specific data
            if ("Customer".equals(roleName)) {
                customerRepository.findByAccountId(userId).ifPresent(customer -> {
                    userData.put("name", customer.getFullName());
                    userData.put("lastName", customer.getLastName());
                    userData.put("firstName", customer.getFirstName());
                    userData.put("middleName", customer.getMiddleName());
                    userData.put("phone", customer.getPhone());
                    userData.put("description", customer.getDescription());
                    userData.put("scopeS", customer.getScopeS());
                    userData.put("customerId", customer.getId()); // Добавляем customerId
                });
            } else if ("Performer".equals(roleName)) {
                performerRepository.findByAccountId(userId).ifPresent(performer -> {
                    userData.put("name", performer.getFullName());
                    userData.put("lastName", performer.getLastName());
                    userData.put("firstName", performer.getFirstName());
                    userData.put("middleName", performer.getMiddleName());
                    userData.put("age", performer.getAge());
                    userData.put("rating", performer.getRating());
                    userData.put("performerId", performer.getId()); // Добавляем performerId
                });
            } else if ("Administrator".equals(roleName) || "SuperAdministrator".equals(roleName)) {
                administratorRepository.findByAccountId(userId).ifPresent(admin -> {
                    userData.put("name", admin.getName());
                });
            }
            
            return ResponseEntity.ok(userData);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error loading user details: " + e.getMessage()));
        }
    }

    // ========== Orders Management ==========

    @GetMapping("/orders")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getAllOrders() {
        try {
            List<Orders> orders = ordersService.findAll();
            List<AddOrderDto> orderDtos = orders.stream()
                    .map(ordersMapper::toDto)
                    .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(Map.of("orders", orderDtos));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error loading orders: " + e.getMessage()));
        }
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<?> getOrder(@PathVariable Integer orderId) {
        return ordersService.findById(orderId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/orders/{orderId}")
    @Transactional
    public ResponseEntity<?> deleteOrder(@PathVariable Integer orderId) {
        try {
            ordersService.deleteById(orderId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Order deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/orders/{orderId}/approve")
    @Transactional
    public ResponseEntity<?> approveOrder(@PathVariable Integer orderId) {
        try {
            Orders order = ordersService.findById(orderId)
                    .orElseThrow(() -> new NotFoundException("Order", orderId));
            
            // Проверяем, что заказ действительно на рассмотрении
            if (!Boolean.TRUE.equals(order.getIsOnReview())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false, 
                    "error", "Заказ не находится на рассмотрении"
                ));
            }
            
            // Одобряем заказ: убираем флаг на рассмотрении и делаем активным
            order.setIsOnReview(false);
            order.setIsActived(true);
            ordersService.save(order);
            
            // Отправляем уведомление заказчику об одобрении заказа
            if (order.getCustomer() != null && order.getCustomer().getAccount() != null) {
                String orderTitle = order.getTitle() != null ? order.getTitle() : "Заказ #" + order.getId();
                notificationService.createOrderApprovedNotification(
                    order.getCustomer().getAccount().getId(),
                    order.getId(),
                    orderTitle
                );
            }
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Заказ успешно одобрен"));
        } catch (NotFoundException e) {
            return ResponseEntity.status(404).body(Map.of("success", false, "error", "Заказ не найден"));
        } catch (Exception e) {
            logger.error("Error approving order: {}", e.getMessage(), e);
            return ResponseEntity.status(400).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/orders/{orderId}/reject")
    @Transactional
    public ResponseEntity<?> rejectOrder(@PathVariable Integer orderId, @RequestBody(required = false) Map<String, String> requestBody) {
        try {
            Orders order = ordersService.findById(orderId)
                    .orElseThrow(() -> new NotFoundException("Order", orderId));
            
            // Проверяем, что заказ действительно на рассмотрении
            if (!Boolean.TRUE.equals(order.getIsOnReview())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false, 
                    "error", "Заказ не находится на рассмотрении"
                ));
            }
            
            String reason = requestBody != null ? requestBody.get("reason") : null;
            
            // Отклоняем заказ: убираем флаг на рассмотрении, помечаем как отклоненный, оставляем неактивным
            order.setIsOnReview(false);
            order.setIsActived(false);
            order.setIsRejected(true);
            ordersService.save(order);
            
            // Отправляем уведомление заказчику об отклонении заказа
            if (order.getCustomer() != null && order.getCustomer().getAccount() != null) {
                String orderTitle = order.getTitle() != null ? order.getTitle() : "Заказ #" + order.getId();
                notificationService.createOrderRejectedNotification(
                    order.getCustomer().getAccount().getId(),
                    order.getId(),
                    orderTitle,
                    reason
                );
            }
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Заказ отклонен"));
        } catch (NotFoundException e) {
            return ResponseEntity.status(404).body(Map.of("success", false, "error", "Заказ не найден"));
        } catch (Exception e) {
            logger.error("Error rejecting order: {}", e.getMessage(), e);
            return ResponseEntity.status(400).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/orders/review")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getOrdersOnReview() {
        try {
            List<Orders> orders = ordersService.findByIsOnReview(true);
            List<AddOrderDto> orderDtos = orders.stream()
                    .map(ordersMapper::toDto)
                    .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(Map.of("orders", orderDtos));
        } catch (Exception e) {
            logger.error("Error loading orders on review: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Error loading orders on review: " + e.getMessage()));
        }
    }

    @GetMapping("/is-super-admin")
    public ResponseEntity<Map<String, Object>> checkSuperAdmin() {
        boolean isSuper = isSuperAdmin();
        return ResponseEntity.ok(Map.of("isSuperAdmin", isSuper));
    }

    // ========== Statistics ==========

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        long totalUsers = accountRepository.count();
        long totalCustomers = customerRepository.count();
        long totalPerformers = performerRepository.count();
        long totalAdministrators = administratorRepository.count();
        long totalOrders = ordersService.findAll().size();
        long activeOrders = ordersService.findByIsActived(true).size();
        long doneOrders = ordersService.findByIsDone(true).size();
        
        return ResponseEntity.ok(Map.of(
            "totalUsers", totalUsers,
            "totalCustomers", totalCustomers,
            "totalPerformers", totalPerformers,
            "totalAdministrators", totalAdministrators,
            "totalOrders", totalOrders,
            "activeOrders", activeOrders,
            "doneOrders", doneOrders
        ));
    }

    // ========== Customer Data for Admin ==========

    @GetMapping("/customer/{customerId}/portfolio")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getCustomerPortfolio(@PathVariable Integer customerId) {
        try {
            Customer customer = customerService.findByIdWithAccount(customerId)
                    .orElseThrow(() -> new NotFoundException("Customer", customerId));
            
            // Преобразуем Customer в CustomerPortfolio DTO
            Map<String, Object> portfolio = new HashMap<>();
            portfolio.put("id", customer.getId());
            portfolio.put("name", customer.getFullName() != null ? customer.getFullName() : "");
            portfolio.put("lastName", customer.getLastName());
            portfolio.put("firstName", customer.getFirstName());
            portfolio.put("middleName", customer.getMiddleName());
            portfolio.put("email", customer.getEmail() != null ? customer.getEmail() : "");
            portfolio.put("phone", customer.getPhone() != null ? customer.getPhone() : "");
            portfolio.put("description", customer.getDescription() != null ? customer.getDescription() : "");
            portfolio.put("scopeS", customer.getScopeS() != null ? customer.getScopeS() : "");
            
            return ResponseEntity.ok(portfolio);
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error getting customer portfolio: " + e.getMessage()));
        }
    }

    @GetMapping("/customer/{customerId}/done-orders")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getCustomerDoneOrders(@PathVariable Integer customerId) {
        try {
            Customer customer = customerService.findById(customerId)
                    .orElseThrow(() -> new NotFoundException("Customer", customerId));
            
            List<Orders> orders = ordersService.findByCustomerId(customer.getId());
            List<AddOrderDto> doneOrders = orders.stream()
                    .filter(o -> Boolean.TRUE.equals(o.getIsDone()))
                    .map(ordersMapper::toDto)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of("orders", doneOrders));
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error getting customer done orders: " + e.getMessage()));
        }
    }

    @GetMapping("/customer/{customerId}/reviews")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getCustomerReviews(@PathVariable Integer customerId) {
        try {
            Customer customer = customerService.findByIdWithAccount(customerId)
                    .orElseThrow(() -> new NotFoundException("Customer", customerId));
            
            // Получаем только отзывы О заказчике от исполнителей (reviewerType = PERFORMER)
            List<WorkExperience> reviews = workExperienceService.findReviewsAboutCustomer(customer.getId());
            List<WorkExperienceDto> reviewDtos = reviews.stream()
                    .map(workExperienceMapper::toDto)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of("reviews", reviewDtos));
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error getting customer reviews: " + e.getMessage()));
        }
    }

    // ========== Performer Data for Admin ==========

    @GetMapping("/performer/{performerId}/done-orders")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getPerformerDoneOrders(@PathVariable Integer performerId) {
        try {
            Performer performer = performerRepository.findById(performerId)
                    .orElseThrow(() -> new NotFoundException("Performer", performerId));
            
            List<Orders> orders = ordersService.findByPerformerId(performer.getId());
            List<AddOrderDto> doneOrders = orders.stream()
                    .filter(o -> Boolean.TRUE.equals(o.getIsDone()))
                    .map(ordersMapper::toDto)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of("orders", doneOrders));
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error getting performer done orders: " + e.getMessage()));
        }
    }

    @GetMapping("/performer/{performerId}/reviews")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getPerformerReviews(@PathVariable Integer performerId) {
        try {
            Performer performer = performerRepository.findById(performerId)
                    .orElseThrow(() -> new NotFoundException("Performer", performerId));
            
            // Получаем только отзывы О исполнителе от заказчиков (reviewerType = CUSTOMER)
            List<WorkExperience> reviews = workExperienceService.findReviewsAboutPerformer(performer.getId());
            List<WorkExperienceDto> reviewDtos = reviews.stream()
                    .map(workExperienceMapper::toDto)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of("reviews", reviewDtos));
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error getting performer reviews: " + e.getMessage()));
        }
    }
}


