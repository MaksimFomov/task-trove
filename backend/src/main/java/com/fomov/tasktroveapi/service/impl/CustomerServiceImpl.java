package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.dto.*;
import com.fomov.tasktroveapi.exception.NotFoundException;
import com.fomov.tasktroveapi.mapper.*;
import com.fomov.tasktroveapi.model.*;
import com.fomov.tasktroveapi.repository.CustomerRepository;
import com.fomov.tasktroveapi.service.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class CustomerServiceImpl implements CustomerService {

    private static final Logger logger = LoggerFactory.getLogger(CustomerServiceImpl.class);

    @Value("${app.email.default-performer}")
    private String defaultPerformerEmail;

    @Value("${app.email.contact}")
    private String contactEmail;

    @Value("${app.customer.default-name}")
    private String defaultCustomerName;

    private final CustomerRepository repository;
    private final OrdersService ordersService;
    private final OrdersMapper ordersMapper;
    private final ChatService chatService;
    private final ChatMapper chatMapper;
    private final MessageService messageService;
    private final MessageMapper messageMapper;
    private final ReplyService replyService;
    private final ReplyMapper replyMapper;
    private final WorkExperienceService workExperienceService;
    private final WorkExperienceMapper workExperienceMapper;
    private final PerformerService performerService;
    private final ReplyUpdateService replyUpdateService;
    private final NotificationService notificationService;
    private final com.fomov.tasktroveapi.service.EmailNotificationService emailNotificationService;

    public CustomerServiceImpl(CustomerRepository repository,
                              OrdersService ordersService,
                              OrdersMapper ordersMapper,
                              ChatService chatService,
                              ChatMapper chatMapper,
                              MessageService messageService,
                              MessageMapper messageMapper,
                              ReplyService replyService,
                              ReplyMapper replyMapper,
                              WorkExperienceService workExperienceService,
                              WorkExperienceMapper workExperienceMapper,
                              PerformerService performerService,
                              ReplyUpdateService replyUpdateService,
                              NotificationService notificationService,
                              com.fomov.tasktroveapi.service.EmailNotificationService emailNotificationService) {
        this.repository = repository;
        this.ordersService = ordersService;
        this.ordersMapper = ordersMapper;
        this.chatService = chatService;
        this.chatMapper = chatMapper;
        this.messageService = messageService;
        this.messageMapper = messageMapper;
        this.replyService = replyService;
        this.replyMapper = replyMapper;
        this.workExperienceService = workExperienceService;
        this.workExperienceMapper = workExperienceMapper;
        this.performerService = performerService;
        this.replyUpdateService = replyUpdateService;
        this.notificationService = notificationService;
        this.emailNotificationService = emailNotificationService;
    }

    @Override
    public List<Customer> findAll() { 
        return repository.findAll(); 
    }

    @Override
    public Optional<Customer> findById(Integer id) { 
        return repository.findById(id); 
    }

    @Override
    public Customer save(Customer customer) { 
        return repository.save(customer); 
    }

    @Override
    public void deleteById(Integer id) { 
        repository.deleteById(id); 
    }

    @Override
    public Optional<Customer> findByAccountId(Integer accountId) {
        return repository.findByAccountId(accountId);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getCustomerOrders(Integer accountId, String searchTerm) {
        Customer customer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
        
        List<Orders> orders;
        if (searchTerm != null && !searchTerm.isBlank()) {
            orders = ordersService.findByTitleContaining(searchTerm);
        } else {
            orders = ordersService.findByCustomerId(customer.getId());
        }
        
        // Фильтруем заказы, удаленные заказчиком
        List<AddOrderDto> orderDtos = orders.stream()
                .filter(order -> !Boolean.TRUE.equals(order.getIsDeletedByCustomer()))
                .map(ordersMapper::toDto)
                .collect(Collectors.toList());
        
        return Map.of("orders", orderDtos);
    }

    @Override
    @Transactional(readOnly = true)
    public AddOrderDto getOrderWithReplies(Integer orderId) {
        Orders order = ordersService.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order", orderId));
        
        // Если заказ удален заказчиком, выбрасываем исключение
        if (Boolean.TRUE.equals(order.getIsDeletedByCustomer())) {
            throw new NotFoundException("Order", orderId);
        }
        
        AddOrderDto dto = ordersMapper.toDto(order);
        List<Reply> replies = replyService.findByOrderId(order.getId());
        
        if (replies != null && !replies.isEmpty()) {
            List<ReplyDto> replyDtos = replies.stream()
                    .map(replyMapper::toDto)
                    .collect(Collectors.toList());
            dto.setReplies(replyDtos);
        } else {
            dto.setReplies(new java.util.ArrayList<>());
        }
        
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getDoneOrders(Integer accountId) {
        Customer customer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
        
        List<Orders> orders = ordersService.findByCustomerId(customer.getId());
        List<Orders> doneOrders = orders.stream()
                .filter(o -> Boolean.TRUE.equals(o.getIsDone()))
                .filter(o -> !Boolean.TRUE.equals(o.getIsDeletedByCustomer()))
                .collect(Collectors.toList());
        
        List<AddOrderDto> orderDtos = doneOrders.stream()
                .map(ordersMapper::toDto)
                .collect(Collectors.toList());
        
        return Map.of("orders", orderDtos);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getCustomerChats(Integer accountId, String tab) {
        Customer customer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
        
        List<Chat> chats = chatService.findByCustomerId(customer.getId());
        
        List<ChatDto> chatDtos = chats.stream()
                .map(chat -> {
                    ChatDto dto = chatMapper.toDto(chat);
                    // Подсчитываем непрочитанные сообщения (сообщения от performer после последней проверки)
                    Long unreadCount = messageService.countUnreadMessages(
                        chat.getId(), 
                        accountId, 
                        chat.getLastCheckedByCustomerTime()
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
        Customer customer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
        
        Chat chat = chatService.findById(chatId)
                .orElseThrow(() -> new NotFoundException("Chat", chatId));
        
        if (!chat.getCustomerId().equals(customer.getId())) {
            throw new SecurityException("Access denied to chat " + chatId);
        }
        
        // Помечаем чат как прочитанный для customer и обновляем время последней проверки
        chat.setCheckByCustomer(true);
        chat.setLastCheckedByCustomerTime(OffsetDateTime.now());
        chatService.save(chat);
        
        List<Message> messages = messageService.findByChatId(chatId);
        List<MessageDto> messageDtos = messages.stream()
                .map(messageMapper::toDto)
                .collect(Collectors.toList());
        
        return Map.of("messages", messageDtos);
    }

    @Override
    public void createOrder(Integer accountId, AddOrderDto dto) {
        Customer customer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
        
        Orders order = ordersMapper.toEntity(dto);
        order.setCustomer(customer);
        order.setPerformer(null);
        order.setIsActived(true);
        order.setPublicationTime(OffsetDateTime.now());
        
        if (order.getReplyBind() == null) {
            order.setReplyBind(0);
        }
        if (order.getIsInProcess() == null) {
            order.setIsInProcess(false);
        }
        if (order.getIsOnCheck() == null) {
            order.setIsOnCheck(false);
        }
        if (order.getIsDone() == null) {
            order.setIsDone(false);
        }
        
        ordersService.save(order);
    }

    @Override
    public void deleteOrder(Integer accountId, Integer orderId) {
        Customer customer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
        
        Orders order = ordersService.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order", orderId));
        
        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new SecurityException("Access denied to order " + orderId);
        }
        
        // Нельзя деактивировать заказ, который в работе (назначен исполнитель)
        if (order.getPerformer() != null) {
            throw new IllegalStateException("Cannot deactivate order that is in progress");
        }
        
        order.setIsActived(false);
        ordersService.save(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void permanentlyDeleteOrder(Integer accountId, Integer orderId) {
        Customer customer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
        
        Orders order = ordersService.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order", orderId));
        
        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new SecurityException("Access denied to order " + orderId);
        }
        
        // Помечаем заказ как удаленный заказчиком (мягкое удаление)
        // Заказ остается в базе данных и виден исполнителю в завершенных заказах
        order.setIsDeletedByCustomer(true);
        ordersService.save(order);
    }

    @Override
    public void activateOrder(Integer accountId, Integer orderId) {
        Customer customer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
        
        Orders order = ordersService.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order", orderId));
        
        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new SecurityException("Access denied to order " + orderId);
        }
        
        // Нельзя активировать завершенный заказ
        if (Boolean.TRUE.equals(order.getIsDone())) {
            throw new IllegalStateException("Cannot activate completed order");
        }
        
        order.setIsActived(true);
        ordersService.save(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void assignPerformerToOrder(Integer accountId, AddPerformerToOrderDto dto) {
        Customer customer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
        
        Orders order = ordersService.findById(dto.getOrderId())
                .orElseThrow(() -> new NotFoundException("Order", dto.getOrderId()));
        
        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new SecurityException("Access denied to order " + dto.getOrderId());
        }
        
        Performer performer = performerService.findById(dto.getPerformerId())
                .orElseThrow(() -> new NotFoundException("Performer", dto.getPerformerId()));
        
        order.setPerformer(performer);
        order.setIsInProcess(true);
        ordersService.save(order);
        
        replyUpdateService.updateReplyOnPerformerAssignment(order.getId(), performer.getId());
        
        // Создаем чат между заказчиком и исполнителем, если его еще нет
        createChatIfNotExists(customer, performer, order);
        
        // Создаем уведомление для исполнителя о принятии в работу
        if (performer.getAccount() != null) {
            String orderTitle = order.getTitle() != null ? order.getTitle() : "Заказ #" + order.getId();
            String customerName = customer.getName() != null ? customer.getName() : "Заказчик";
            notificationService.createAssignedNotification(
                performer.getAccount().getId(),
                customer.getId(),
                order.getId(),
                orderTitle,
                customerName
            );
        }
    }
    
    private void createChatIfNotExists(Customer customer, Performer performer, Orders order) {
        // Формируем roomName для этого конкретного заказа
        String roomName = "Order #" + order.getId() + ": " + 
                         (order.getTitle() != null ? order.getTitle() : "Chat");
        
        // Проверяем, существует ли уже чат для этого конкретного заказа
        List<Chat> existingChats = chatService.findByRoomName(roomName);
        boolean chatExists = !existingChats.isEmpty();
        
        if (!chatExists) {
            Chat chat = new Chat();
            chat.setCustomer(customer);
            chat.setPerformer(performer);
            chat.setRoomName(roomName);
            chat.setCheckByCustomer(false);
            chat.setCheckByPerformer(false);
            chat.setCheckByAdministrator(false);
            chatService.save(chat);
            
            logger.info("Created chat between customer {} and performer {} for order {}", 
                       customer.getId(), performer.getId(), order.getId());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateOrderStatus(Integer accountId, ReadyOrderDto dto) {
        Customer customer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
        
        Orders order = ordersService.findById(dto.getOrderId())
                .orElseThrow(() -> new NotFoundException("Order", dto.getOrderId()));
        
        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new SecurityException("Access denied to order " + dto.getOrderId());
        }
        
        if (dto.getIsDone() != null) {
            order.setIsDone(dto.getIsDone());
            
            if (dto.getIsDone() && order.getPerformer() != null) {
                order.setIsOnCheck(false);
                replyUpdateService.updateReplyOnOrderCompletion(order.getId(), order.getPerformer().getId());
                
                // Создаем уведомление для заказчика о завершении заказа
                String orderTitle = order.getTitle() != null ? order.getTitle() : "Заказ #" + order.getId();
                String performerName = order.getPerformer().getName() != null ? order.getPerformer().getName() : "Исполнитель";
                notificationService.createCompletedNotification(
                    customer.getAccount().getId(),
                    order.getPerformer().getId(),
                    order.getId(),
                    orderTitle,
                    performerName
                );
            }
        }
        
        if (dto.getIsOnCheck() != null) {
            order.setIsOnCheck(dto.getIsOnCheck());
        }
        
        ordersService.save(order);
    }

    @Override
    public void addReview(Integer accountId, WorkExperienceDto dto) {
        Customer customer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
        
        Performer performer = performerService.findById(dto.getPerformerId())
                .orElseThrow(() -> new NotFoundException("Performer", dto.getPerformerId()));
        
        WorkExperience workExperience = workExperienceMapper.toEntity(dto);
        workExperience.setCustomer(customer);
        workExperience.setPerformer(performer);
        workExperienceService.save(workExperience);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void sendEmailToPerformer(Integer accountId, Integer orderId, Integer performerId,
                                    String text, MultipartFile document, Boolean isCorrection) {
        Orders order = null;
        Performer performer = null;
        
        if (orderId != null) {
            order = ordersService.findById(orderId).orElse(null);
        }
        
        String performerEmail = defaultPerformerEmail;
        if (performerId != null) {
            performer = performerService.findByIdWithAccount(performerId).orElse(null);
            if (performer != null && performer.getEmail() != null) {
                performerEmail = performer.getEmail();
            }
        }
        
        String emailText = buildEmailText(text, order);
        String attachmentPath = saveAttachment(document);
        
        if (isCorrection && order != null && performerId != null) {
            handleCorrection(order, orderId, performerId);
            
            // Создаем уведомление для исполнителя о правках
            if (performer != null && performer.getAccount() != null) {
                String orderTitle = order.getTitle() != null ? order.getTitle() : "Заказ #" + order.getId();
                Customer customer = repository.findByAccountId(accountId).orElse(null);
                String customerName = customer != null && customer.getName() != null ? customer.getName() : "Заказчик";
                notificationService.createCorrectionNotification(
                    performer.getAccount().getId(),
                    customer != null ? customer.getId() : null,
                    order.getId(),
                    orderTitle,
                    customerName
                );
            }
        }
        
        sendEmail(performerEmail, emailText, attachmentPath, isCorrection);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void refusePerformer(Integer accountId, Integer orderId) {
        Customer customer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
        
        Orders order = ordersService.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order", orderId));
        
        if (order.getCustomer() == null || !order.getCustomer().getId().equals(customer.getId())) {
            throw new SecurityException("Order does not belong to customer");
        }
        
        if (order.getPerformer() == null) {
            throw new IllegalStateException("Order has no assigned performer");
        }
        
        Integer performerId = order.getPerformer().getId();
        Performer performer = performerService.findByIdWithAccount(performerId).orElse(null);
        
        String orderTitle = order.getTitle() != null ? order.getTitle() : "заказ #" + order.getId();
        String customerName = customer.getName() != null ? customer.getName() : "Заказчик";
        String performerName = performer != null && performer.getName() != null 
                ? performer.getName() : "Исполнитель";
        
        replyService.deleteByOrderIdAndPerformerId(orderId, performerId);
        
        order = ordersService.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order", orderId));
        
        order.setPerformer(null);
        order.setIsInProcess(false);
        ordersService.save(order);
        
        // Создаем уведомление для исполнителя об отказе
        if (performer != null && performer.getAccount() != null) {
            notificationService.createRefusedNotification(
                performer.getAccount().getId(),
                performer.getId(),
                orderId,
                orderTitle,
                customerName
            );
        }
        
        sendRefusalEmail(performer, performerName, customerName, orderTitle);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteChat(Integer accountId, Integer chatId) {
        Customer customer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
        
        Chat chat = chatService.findById(chatId)
                .orElseThrow(() -> new NotFoundException("Chat", chatId));
        
        if (!chat.getCustomerId().equals(customer.getId())) {
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
        
        // Помечаем чат как удаленный для заказчика
        chat.setDeletedByCustomer(true);
        chatService.save(chat);
        
        logger.info("Chat {} deleted by customer {}", chatId, customer.getId());
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

    private String buildEmailText(String text, Orders order) {
        StringBuilder emailText = new StringBuilder("Вас успешно утвердили.\n");
        
        if (text != null) {
            emailText.append("Вот ваше ТЗ:\n").append(text).append("\n");
        }
        
        if (order != null && order.getCustomer() != null) {
            String customerName = order.getCustomer().getName() != null 
                    ? order.getCustomer().getName() 
                    : defaultCustomerName;
            emailText.append("Имя заказчика: ").append(customerName).append("\n");
        }
        
        emailText.append("Почта для связи: ").append(contactEmail);
        return emailText.toString();
    }

    private String saveAttachment(MultipartFile document) {
        if (document != null && !document.isEmpty()) {
            try {
                String fileName = document.getOriginalFilename();
                java.nio.file.Path tempFile = java.nio.file.Files.createTempFile(
                        "order_", 
                        fileName != null ? fileName : "document"
                );
                document.transferTo(tempFile.toFile());
                return tempFile.toString();
            } catch (Exception e) {
                logger.error("Failed to save attachment: {}", e.getMessage(), e);
            }
        }
        return null;
    }

    private void handleCorrection(Orders order, Integer orderId, Integer performerId) {
        order.setIsOnCheck(false);
        ordersService.save(order);
        replyUpdateService.resetReplyOnCorrection(orderId, performerId);
    }

    private void sendEmail(String performerEmail, String emailText, String attachmentPath, Boolean isCorrection) {
        if (isCorrection) {
            emailNotificationService.sendCorrectionRequestEmail(performerEmail, emailText, attachmentPath);
        } else {
            emailNotificationService.sendPerformerApprovalEmail(performerEmail, emailText, attachmentPath);
        }
    }

    private void sendRefusalEmail(Performer performer, String performerName, 
                                  String customerName, String orderTitle) {
        emailNotificationService.sendPerformerRefusalEmail(performer, performerName, customerName, orderTitle);
    }
}
