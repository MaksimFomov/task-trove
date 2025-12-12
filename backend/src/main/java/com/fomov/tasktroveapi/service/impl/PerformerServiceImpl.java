package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.dto.*;
import com.fomov.tasktroveapi.exception.NotFoundException;
import com.fomov.tasktroveapi.exception.YouAlreadyRepliedException;
import com.fomov.tasktroveapi.mapper.*;
import com.fomov.tasktroveapi.model.*;
import com.fomov.tasktroveapi.repository.CustomerRepository;
import com.fomov.tasktroveapi.repository.PerformerRepository;
import com.fomov.tasktroveapi.service.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class PerformerServiceImpl implements PerformerService {

    private static final Logger logger = LoggerFactory.getLogger(PerformerServiceImpl.class);

    private final PerformerRepository repository;
    private final OrdersService ordersService;
    private final OrdersMapper ordersMapper;
    private final ReplyService replyService;
    private final ReplyMapper replyMapper;
    private final PortfolioService portfolioService;
    private final CustomerRepository customerRepository;
    private final ChatService chatService;
    private final ChatMapper chatMapper;
    private final MessageService messageService;
    private final MessageMapper messageMapper;
    private final WorkExperienceService workExperienceService;
    private final WorkExperienceMapper workExperienceMapper;
    private final NotificationService notificationService;
    private final com.fomov.tasktroveapi.service.EmailNotificationService emailNotificationService;

    public PerformerServiceImpl(PerformerRepository repository,
                               OrdersService ordersService,
                               OrdersMapper ordersMapper,
                               ReplyService replyService,
                               ReplyMapper replyMapper,
                               PortfolioService portfolioService,
                               CustomerRepository customerRepository,
                               ChatService chatService,
                               ChatMapper chatMapper,
                               MessageService messageService,
                               MessageMapper messageMapper,
                               WorkExperienceService workExperienceService,
                               WorkExperienceMapper workExperienceMapper,
                               NotificationService notificationService,
                               com.fomov.tasktroveapi.service.EmailNotificationService emailNotificationService) {
        this.repository = repository;
        this.ordersService = ordersService;
        this.ordersMapper = ordersMapper;
        this.replyService = replyService;
        this.replyMapper = replyMapper;
        this.portfolioService = portfolioService;
        this.customerRepository = customerRepository;
        this.chatService = chatService;
        this.chatMapper = chatMapper;
        this.messageService = messageService;
        this.messageMapper = messageMapper;
        this.workExperienceService = workExperienceService;
        this.workExperienceMapper = workExperienceMapper;
        this.notificationService = notificationService;
        this.emailNotificationService = emailNotificationService;
    }

    @Override
    public List<Performer> findAll() { 
        return repository.findAll(); 
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Performer> findById(Integer id) { 
        return repository.findById(id); 
    }

    @Override
    public Performer save(Performer performer) { 
        return repository.save(performer); 
    }

    @Override
    public void deleteById(Integer id) { 
        repository.deleteById(id); 
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Performer> findByAccountId(Integer accountId) {
        return repository.findByAccountId(accountId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<Performer> findByIdWithAccount(Integer id) {
        return repository.findByIdWithAccount(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAvailableOrders(Integer accountId, String searchTerm, 
                                                   String sortBy, int page, int pageSize) {
        Sort sort = buildSort(sortBy);
        
        List<Orders> orders;
        if (searchTerm != null && !searchTerm.isBlank()) {
            orders = ordersService.findByTitleContainingAndActive(searchTerm);
        } else {
            orders = ordersService.findAllActive();
        }
        
        // Manual pagination
        int start = (page - 1) * pageSize;
        int end = Math.min(start + pageSize, orders.size());
        List<Orders> pagedOrders = orders.subList(Math.max(0, start), end);
        
        Performer performer = null;
        if (accountId != null) {
            performer = repository.findByAccountId(accountId).orElse(null);
        }
        final Performer currentPerformer = performer;
        
        List<AddOrderDto> orderDtos = pagedOrders.stream()
                .map(order -> {
                    AddOrderDto dto = ordersMapper.toDto(order);
                    if (currentPerformer != null) {
                        boolean hasReplied = replyService.existsByOrderIdAndPerformerId(
                                order.getId(), currentPerformer.getId());
                        dto.setHasReplied(hasReplied);
                    }
                    return dto;
                })
                .collect(Collectors.toList());
        
        return Map.of("orders", orderDtos);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getMyActiveOrders(Integer accountId, String searchTerm) {
        Performer performer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Performer", accountId));
        
        List<Orders> orders = ordersService.findByPerformerId(performer.getId());
        
        // Filter only orders assigned to this performer and not completed
        orders = orders.stream()
                .filter(order -> order.getPerformer() != null && 
                               order.getPerformer().getId().equals(performer.getId()))
                .filter(order -> order.getIsDone() == null || !order.getIsDone())
                .collect(Collectors.toList());
        
        // Apply search if specified
        if (searchTerm != null && !searchTerm.isBlank()) {
            String searchLower = searchTerm.toLowerCase();
            orders = orders.stream()
                    .filter(order -> 
                        (order.getTitle() != null && order.getTitle().toLowerCase().contains(searchLower)) ||
                        (order.getDescription() != null && order.getDescription().toLowerCase().contains(searchLower)) ||
                        (order.getScope() != null && order.getScope().toLowerCase().contains(searchLower))
                    )
                    .collect(Collectors.toList());
        }
        
        List<AddOrderDto> orderDtos = orders.stream()
                .map(ordersMapper::toDto)
                .collect(Collectors.toList());
        
        return Map.of("orders", orderDtos);
    }

    @Override
    @Transactional(readOnly = true)
    public AddOrderDto getOrderDetails(Integer accountId, Integer orderId) {
        Orders order = ordersService.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order", orderId));
        
        // Проверяем, что заказ активен или назначен текущему исполнителю
        Performer currentPerformer = null;
        if (accountId != null) {
            currentPerformer = repository.findByAccountId(accountId).orElse(null);
        }
        
        boolean isAssignedToPerformer = currentPerformer != null && 
                                        order.getPerformer() != null && 
                                        order.getPerformer().getId().equals(currentPerformer.getId());
        
        // Проверяем доступ к заказу
        boolean isOrderDeleted = Boolean.TRUE.equals(order.getIsDeletedByCustomer());
        boolean isOrderActive = Boolean.TRUE.equals(order.getIsActived());
        
        // Если заказ удален заказчиком, исполнитель может видеть его только если он назначен и заказ завершен
        if (isOrderDeleted && (!isAssignedToPerformer || !Boolean.TRUE.equals(order.getIsDone()))) {
            throw new NotFoundException("Order", orderId);
        }
        
        // Если заказ неактивен и не назначен текущему исполнителю, выбрасываем исключение
        if (!isOrderActive && !isAssignedToPerformer) {
            throw new NotFoundException("Order", orderId);
        }
        
        AddOrderDto dto = ordersMapper.toDto(order);
        
        // Add replies if they exist
        List<Reply> replies = replyService.findByOrderId(order.getId());
        if (replies != null && !replies.isEmpty()) {
            List<ReplyDto> replyDtos = replies.stream()
                    .map(replyMapper::toDto)
                    .collect(Collectors.toList());
            dto.setReplies(replyDtos);
        } else {
            dto.setReplies(new java.util.ArrayList<>());
        }
        
        // Check if current performer has replied to this order
        if (currentPerformer != null) {
            boolean hasReplied = replyService.existsByOrderIdAndPerformerId(
                    order.getId(), currentPerformer.getId());
            dto.setHasReplied(hasReplied);
        }
        
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getMyReplies(Integer accountId, String tab) {
        Performer performer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Performer", accountId));
        
        List<Reply> replies = replyService.findByPerformerIdWithRelations(performer.getId());
        
        // Фильтруем отклики в зависимости от вкладки
        replies = replies.stream()
                .filter(reply -> reply.getOrders() != null)
                .filter(reply -> {
                    Orders order = reply.getOrders();
                    // Для завершенных заказов (tab='done') показываем все, включая удаленные заказчиком
                    if ("done".equalsIgnoreCase(tab) || "history".equalsIgnoreCase(tab)) {
                        return true;
                    }
                    // Для остальных вкладок показываем только активные и не удаленные заказчиком
                    return Boolean.TRUE.equals(order.getIsActived()) && 
                           !Boolean.TRUE.equals(order.getIsDeletedByCustomer());
                })
                .collect(Collectors.toList());
        
        // Filter by tab if needed
        if (tab != null) {
            replies = filterRepliesByTab(replies, tab);
        }
        
        List<ReplyDto> replyDtos = replies.stream()
                .map(reply -> enrichReplyDto(reply))
                .collect(Collectors.toList());
        
        return Map.of("reply", replyDtos);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getMyChats(Integer accountId, String tab) {
        Performer performer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Performer", accountId));
        
        List<Chat> chats = chatService.findByPerformerId(performer.getId());
        
        List<ChatDto> chatDtos = chats.stream()
                .map(chat -> {
                    ChatDto dto = chatMapper.toDto(chat);
                    // Подсчитываем непрочитанные сообщения (сообщения от customer после последней проверки)
                    Long unreadCount = messageService.countUnreadMessages(
                        chat.getId(), 
                        accountId, 
                        chat.getLastCheckedByPerformerTime()
                    );
                    dto.setUnreadCount(unreadCount != null ? unreadCount.intValue() : 0);
                    
                    // Заполняем информацию о заказе для проверки возможности удаления
                    Integer orderId = extractOrderIdFromRoomName(chat.getRoomName());
                    if (orderId != null) {
                        dto.setOrderId(orderId);
                        ordersService.findById(orderId).ifPresent(order -> {
                            dto.setOrderIsDone(order.getIsDone());
                            dto.setOrderPerformerId(order.getPerformer() != null ? order.getPerformer().getId() : null);
                        });
                    }
                    
                    return dto;
                })
                .collect(Collectors.toList());
        
        return Map.of("chats", chatDtos);
    }

    @Override
    @Transactional
    public Map<String, Object> getChatMessages(Integer accountId, Integer chatId) {
        Performer performer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Performer", accountId));
        
        Chat chat = chatService.findById(chatId)
                .orElseThrow(() -> new NotFoundException("Chat", chatId));
        
        if (!chat.getPerformer().getId().equals(performer.getId())) {
            throw new SecurityException("Access denied to chat " + chatId);
        }
        
        // Помечаем чат как прочитанный для performer и обновляем время последней проверки
        chat.setCheckByPerformer(true);
        chat.setLastCheckedByPerformerTime(java.time.OffsetDateTime.now());
        chatService.save(chat);
        
        List<Message> messages = messageService.findByChatId(chatId);
        List<MessageDto> messageDtos = messages.stream()
                .map(messageMapper::toDto)
                .collect(Collectors.toList());
        
        return Map.of("messages", messageDtos);
    }

    @Override
    @Transactional
    public void markChatAsRead(Integer accountId, Integer chatId) {
        Performer performer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Performer", accountId));
        
        Chat chat = chatService.findById(chatId)
                .orElseThrow(() -> new NotFoundException("Chat", chatId));
        
        if (!chat.getPerformer().getId().equals(performer.getId())) {
            throw new SecurityException("Access denied to chat " + chatId);
        }
        
        // Помечаем чат как прочитанный для performer и обновляем время последней проверки
        chat.setCheckByPerformer(true);
        chat.setLastCheckedByPerformerTime(java.time.OffsetDateTime.now());
        chatService.save(chat);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Integer createReply(Integer accountId, ReplyDto dto) {
        Performer performer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Performer", accountId));
        
        // Check that user hasn't already replied to this order
        if (replyService.existsByOrderIdAndPerformerId(dto.getOrderId(), performer.getId())) {
            throw new YouAlreadyRepliedException();
        }
        
        Orders order = ordersService.findById(dto.getOrderId())
                .orElseThrow(() -> new NotFoundException("Order", dto.getOrderId()));
        
        Reply reply = new Reply(order, performer);
        Reply saved = replyService.save(reply);
        
        // Создаем уведомление для заказчика о новом отклике
        if (order.getCustomer() != null && order.getCustomer().getAccount() != null) {
            String orderTitle = order.getTitle() != null ? order.getTitle() : "Заказ #" + order.getId();
            String performerName = performer.getFullName() != null ? performer.getFullName() : "Исполнитель";
            notificationService.createReplyNotification(
                order.getCustomer().getAccount().getId(),
                performer.getId(),
                order.getId(),
                orderTitle,
                performerName
            );
        }
        
        return saved.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateTaskStatus(Integer accountId, UpdateReplyDto dto) {
        if (dto.getId() == null) {
            throw new IllegalArgumentException("Reply ID is required");
        }
        
        Performer performer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Performer", accountId));
        
        Reply reply = replyService.findById(dto.getId())
                .orElseThrow(() -> new NotFoundException("Reply", dto.getId()));
        
        if (!reply.getPerformerId().equals(performer.getId())) {
            throw new SecurityException("Access denied to reply " + dto.getId());
        }
        
        if (dto.getIsDoneThisTask() != null) {
            reply.setIsDoneThisTask(dto.getIsDoneThisTask());
            
            // When performer completes task, order automatically goes to check
            if (dto.getIsDoneThisTask() && reply.getOrderId() != null) {
                handleTaskCompletion(reply, performer);
            }
        }
        if (dto.getIsOnCustomer() != null) {
            reply.setIsOnCustomer(dto.getIsOnCustomer());
        }
        if (dto.getDonned() != null) {
            reply.setDonned(dto.getDonned());
        }
        
        replyService.save(reply);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updatePortfolio(Integer accountId, UpdatePortfolioDto dto) {
        Performer performer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Performer", accountId));
        
        // Обновляем ФИО исполнителя
        performer.setLastName(dto.getLastName());
        performer.setFirstName(dto.getFirstName());
        performer.setMiddleName(dto.getMiddleName());
        repository.save(performer);
        
        logger.info("Updating portfolio for performer ID: {}, data: lastName={}, firstName={}, middleName={}, email={}, phone={}, townCountry={}, specializations={}, employment={}, experience={}", 
            performer.getId(), dto.getLastName(), dto.getFirstName(), dto.getMiddleName(), dto.getEmail(), dto.getPhone(), dto.getTownCountry(), 
            dto.getSpecializations(), dto.getEmployment(), dto.getExperience());
        
        Portfolio updated = portfolioService.updatePortfolio(performer.getId(), dto);
        
        // Явно вызываем flush, чтобы убедиться, что изменения сохранены
        repository.flush();
        
        logger.info("Portfolio updated successfully. ID: {}, name: {}", 
            updated.getId(), performer.getFullName());
    }

    @Override
    public void deleteReply(Integer accountId, Integer replyId) {
        Performer performer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Performer", accountId));
        
        Reply reply = replyService.findById(replyId)
                .orElseThrow(() -> new NotFoundException("Reply", replyId));
        
        if (!reply.getPerformerId().equals(performer.getId())) {
            throw new SecurityException("Access denied to reply " + replyId);
        }
        
        replyService.deleteById(replyId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteCompletedReply(Integer accountId, Integer replyId) {
        Performer performer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Performer", accountId));
        
        Reply reply = replyService.findById(replyId)
                .orElseThrow(() -> new NotFoundException("Reply", replyId));
        
        if (!reply.getPerformerId().equals(performer.getId())) {
            throw new SecurityException("Access denied to reply " + replyId);
        }
        
        // Проверяем, что отклик действительно завершен
        if (!Boolean.TRUE.equals(reply.getDonned())) {
            throw new IllegalStateException("Can only delete completed replies");
        }
        
        logger.info("Deleting completed reply ID: {} for performer ID: {}", replyId, performer.getId());
        replyService.deleteById(replyId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void refuseOrder(Integer accountId, Integer orderId) {
        Performer performer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Performer", accountId));
        
        Orders order = ordersService.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order", orderId));
        
        // Check that order is actually assigned to current performer
        if (order.getPerformer() == null || !order.getPerformer().getId().equals(performer.getId())) {
            throw new SecurityException("Order is not assigned to you");
        }
        
        // Save information for email
        Integer performerId = performer.getId();
        Customer customer = customerRepository.findByIdWithAccount(order.getCustomer().getId())
                .orElse(null);
        String orderTitle = order.getTitle() != null ? order.getTitle() : "заказ #" + order.getId();
        String performerName = performer.getFullName() != null ? performer.getFullName() : "Исполнитель";
        
        // Delete this performer's reply (other performers' replies remain)
        replyService.deleteByOrderIdAndPerformerId(orderId, performerId);
        
        // Reload order from DB to avoid issues with deleted reply in collection
        order = ordersService.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order", orderId));
        
        // Remove performer from order and return to active status
        order.setPerformer(null);
        order.setIsInProcess(false);
        ordersService.save(order);
        
        // Создаем уведомление для заказчика об отказе исполнителя
        if (customer != null && customer.getAccount() != null) {
            notificationService.createPerformerRefusedNotification(
                customer.getAccount().getId(),
                performerId,
                orderId,
                orderTitle,
                performerName
            );
        }
        
        // Send email to customer
        sendRefusalEmail(customer, performerName, orderTitle);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getPerformerInfo(Integer accountId) {
        Performer performer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Performer", accountId));
        
        return Map.of(
            "id", performer.getId(),
            "accountId", accountId,
            "name", performer.getFullName() != null ? performer.getFullName() : ""
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getMyReviews(Integer accountId) {
        Performer performer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Performer", accountId));
        
        // Получаем только отзывы О исполнителе от заказчиков (reviewerType = CUSTOMER)
        List<WorkExperience> reviews = workExperienceService.findReviewsAboutPerformer(performer.getId());
        List<WorkExperienceDto> reviewDtos = reviews.stream()
                .map(workExperienceMapper::toDto)
                .collect(Collectors.toList());
        
        return Map.of("reviews", reviewDtos);
    }

    // Private helper methods
    
    private Sort buildSort(String sortBy) {
        Sort sort = Sort.by(Sort.Direction.ASC, "id");
        if (sortBy != null && !sortBy.isBlank()) {
            try {
                String[] parts = sortBy.split(":");
                if (parts.length == 2) {
                    sort = Sort.by("desc".equalsIgnoreCase(parts[1]) ? 
                        Sort.Direction.DESC : Sort.Direction.ASC, parts[0]);
                } else {
                    sort = Sort.by(Sort.Direction.ASC, sortBy);
                }
            } catch (Exception e) {
                // Use default sort
                logger.warn("Invalid sort parameter: {}, using default sort", sortBy);
            }
        }
        return sort;
    }

    private List<Reply> filterRepliesByTab(List<Reply> replies, String tab) {
        switch (tab.toLowerCase()) {
            case "done":
            case "history":
                return replies.stream()
                        .filter(r -> Boolean.TRUE.equals(r.getDonned()))
                        .collect(Collectors.toList());
            case "approved":
            case "pending":
                return replies.stream()
                        .filter(r -> Boolean.TRUE.equals(r.getIsOnCustomer()) && 
                                   !Boolean.TRUE.equals(r.getIsDoneThisTask()))
                        .collect(Collectors.toList());
            default:
                return replies;
        }
    }

    private ReplyDto enrichReplyDto(Reply reply) {
        ReplyDto dto = replyMapper.toDto(reply);
        
        if (reply.getOrders() != null) {
            Orders order = reply.getOrders();
            dto.setOrderNameByOrder(order.getTitle());
            dto.setOrderDescription(order.getDescription());
            dto.setOrderScope(order.getScope());
            dto.setOrderStackS(order.getStackS());
            if (order.getPublicationTime() != null) {
                dto.setOrderPublicationTime(order.getPublicationTime().toString());
            }
            
            List<Reply> orderReplies = replyService.findByOrderId(order.getId());
            dto.setOrderHowReplies(orderReplies != null ? orderReplies.size() : 0);
        }
        if (reply.getPerformer() != null) {
            dto.setPerfName(reply.getPerformer().getFullName());
        }
        
        return dto;
    }

    @Transactional(rollbackFor = Exception.class)
    private void handleTaskCompletion(Reply reply, Performer performer) {
        Orders order = ordersService.findById(reply.getOrderId())
                .orElseThrow(() -> new NotFoundException("Order", reply.getOrderId()));
        order.setIsOnCheck(true);
        ordersService.save(order);
        
        // Send email to customer about completed work
        Customer customer = customerRepository.findByIdWithAccount(order.getCustomer().getId())
                .orElse(null);
        String orderTitle = order.getTitle() != null ? order.getTitle() : "заказ #" + order.getId();
        String performerName = performer.getFullName() != null ? performer.getFullName() : "Исполнитель";
        
        emailNotificationService.sendWorkCompletionEmail(customer, performerName, orderTitle);
        
        // Создаем уведомление для заказчика о завершении работы
        if (customer != null && customer.getAccount() != null) {
            notificationService.createCompletedNotification(
                customer.getAccount().getId(),
                performer.getId(),
                order.getId(),
                orderTitle,
                performerName
            );
        }
    }

    private void sendRefusalEmail(Customer customer, String performerName, String orderTitle) {
        emailNotificationService.sendCustomerRefusalEmail(customer, performerName, orderTitle);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void addReview(Integer accountId, WorkExperienceDto dto) {
        Performer performer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Performer", accountId));
        
        // Проверяем, что заказ существует и завершен
        Orders order = null;
        if (dto.getOrderId() != null) {
            order = ordersService.findById(dto.getOrderId())
                    .orElseThrow(() -> new NotFoundException("Order", dto.getOrderId()));
            
            // Проверяем, что заказ завершен
            if (!Boolean.TRUE.equals(order.getIsDone())) {
                throw new IllegalStateException("Cannot add review for order that is not completed");
            }
            
            // Проверяем, что заказ выполнен текущим исполнителем
            if (order.getPerformer() == null || !order.getPerformer().getId().equals(performer.getId())) {
                throw new SecurityException("Access denied to order " + dto.getOrderId());
            }
            
            // Проверяем, что заказ имеет заказчика
            if (order.getCustomer() == null) {
                throw new IllegalStateException("Order does not have a customer assigned");
            }
        }
        
        // Получаем заказчика: если заказ указан, используем заказчика из заказа
        // Это более надежно, чем поиск по ID из DTO
        Customer customer;
        if (order != null && order.getCustomer() != null) {
            // Используем заказчика из заказа - это гарантирует, что отзыв оставляется правильному заказчику
            customer = order.getCustomer();
        } else {
            // Если заказ не указан, ищем заказчика по ID из DTO
            Integer customerIdFromDto = dto.getCustomerId();
            if (customerIdFromDto == null || customerIdFromDto == 0) {
                throw new IllegalArgumentException("Customer ID is required when order is not specified");
            }
            customer = customerRepository.findById(customerIdFromDto)
                    .orElseThrow(() -> new NotFoundException("Customer", customerIdFromDto));
        }
        
        WorkExperience workExperience = workExperienceMapper.toEntity(dto);
        workExperience.setCustomer(customer);
        workExperience.setPerformer(performer);
        workExperience.setReviewerType(ReviewerType.PERFORMER); // Исполнитель оставляет отзыв о заказчике
        workExperience.setOrder(order);
        workExperienceService.save(workExperience);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteChat(Integer accountId, Integer chatId) {
        Performer performer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Performer", accountId));
        
        Chat chat = chatService.findById(chatId)
                .orElseThrow(() -> new NotFoundException("Chat", chatId));
        
        if (!chat.getPerformerId().equals(performer.getId())) {
            throw new SecurityException("Access denied to chat " + chatId);
        }
        
        // Извлекаем ID заказа из roomName (формат: "Order #14: Название")
        Integer orderId = extractOrderIdFromRoomName(chat.getRoomName());
        if (orderId == null) {
            throw new IllegalStateException("Cannot extract order ID from chat roomName");
        }
        
        Orders order = ordersService.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order", orderId));
        
        // Проверяем условия: заказ завершен ИЛИ исполнитель не привязан
        boolean canDelete = Boolean.TRUE.equals(order.getIsDone()) || 
                           order.getPerformer() == null;
        
        if (!canDelete) {
            throw new IllegalStateException("Chat can only be deleted for completed orders or orders without assigned performer");
        }
        
        // Помечаем чат как удаленный для исполнителя
        chat.setDeletedByPerformer(true);
        chatService.save(chat);
        
        logger.info("Chat {} deleted by performer {}", chatId, performer.getId());
    }
    
    private Integer extractOrderIdFromRoomName(String roomName) {
        if (roomName == null || !roomName.startsWith("Order #")) {
            return null;
        }
        try {
            // Формат: "Order #14: Название"
            String[] parts = roomName.split(":");
            if (parts.length > 0) {
                String orderPart = parts[0].trim(); // "Order #14"
                String idStr = orderPart.replace("Order #", "").trim();
                return Integer.parseInt(idStr);
            }
        } catch (NumberFormatException e) {
            logger.error("Failed to extract order ID from roomName: {}", roomName, e);
        }
        return null;
    }
}
