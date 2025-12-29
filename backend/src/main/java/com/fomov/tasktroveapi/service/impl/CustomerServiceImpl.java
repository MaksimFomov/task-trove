package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.dto.*;
import com.fomov.tasktroveapi.exception.NotFoundException;
import com.fomov.tasktroveapi.mapper.*;
import com.fomov.tasktroveapi.model.*;
import com.fomov.tasktroveapi.repository.CustomerRepository;
import com.fomov.tasktroveapi.repository.AccountRepository;
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
    private final PortfolioService portfolioService;
    private final NotificationService notificationService;
    private final com.fomov.tasktroveapi.service.EmailNotificationService emailNotificationService;
    private final AccountRepository accountRepository;

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
                              PortfolioService portfolioService,
                              NotificationService notificationService,
                              com.fomov.tasktroveapi.service.EmailNotificationService emailNotificationService,
                              AccountRepository accountRepository) {
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
        this.portfolioService = portfolioService;
        this.notificationService = notificationService;
        this.emailNotificationService = emailNotificationService;
        this.accountRepository = accountRepository;
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
    public Optional<Customer> findByIdWithAccount(Integer id) {
        return repository.findByIdWithAccount(id);
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
            orders = ordersService.findByCustomerIdAndSearchTerm(customer.getId(), searchTerm);
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
        // Используем findByOrderIdWithRelations чтобы загрузить performer для каждого reply
        List<Reply> replies = replyService.findByOrderIdWithRelations(order.getId());
        
        if (replies != null && !replies.isEmpty()) {
            // Фильтруем отклики, где performer был удален (orphaned replies)
            List<ReplyDto> replyDtos = replies.stream()
                    .filter(reply -> reply.getPerformer() != null && reply.getPerformer().getId() != null)
                    .map(replyMapper::toDto)
                    .collect(Collectors.toList());
            
            // Логируем удаленные отклики для отладки
            long orphanedCount = replies.size() - replyDtos.size();
            if (orphanedCount > 0) {
                logger.warn("Found {} orphaned replies (with deleted performers) for order {}", orphanedCount, order.getId());
            }
            
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
                .filter(o -> o.getStatus() == com.fomov.tasktroveapi.model.OrderStatus.DONE)
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
                            dto.setOrderIsDone(order.getStatus() == com.fomov.tasktroveapi.model.OrderStatus.DONE);
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
        
        // Проверяем доступ: сравниваем accountId, а не customer.id
        if (chat.getCustomer() == null || 
            chat.getCustomer().getAccount() == null ||
            !chat.getCustomer().getAccount().getId().equals(accountId)) {
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
    @Transactional
    public void markChatAsRead(Integer accountId, Integer chatId) {
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
    }

    @Override
    public void createOrder(Integer accountId, AddOrderDto dto) {
        Customer customer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
        
        Orders order = ordersMapper.toEntity(dto);
        order.setCustomer(customer);
        order.setPerformer(null);
        // Новые заказы по умолчанию на рассмотрении, пока администратор не одобрит
        order.setStatus(com.fomov.tasktroveapi.model.OrderStatus.ON_REVIEW);
        order.setPublicationTime(OffsetDateTime.now());
        
        if (order.getReplyBind() == null) {
            order.setReplyBind(0);
        }
        
        ordersService.save(order);
        
        // Отправляем уведомление всем администраторам о новом заказе на рассмотрении
        String orderTitle = order.getTitle() != null ? order.getTitle() : "Заказ #" + order.getId();
        String customerName = customer.getFullName() != null ? customer.getFullName() : "Заказчик";
        
        // Находим всех администраторов (Administrator и SuperAdministrator)
        List<Account> allAccounts = accountRepository.findAllWithRole();
        for (Account account : allAccounts) {
            if (account.getRole() != null) {
                String roleName = account.getRole().getName();
                if ("Administrator".equals(roleName) || "SuperAdministrator".equals(roleName)) {
                    notificationService.createOrderReviewNotification(
                        account.getId(),
                        customer.getId(),
                        order.getId(),
                        orderTitle,
                        customerName
                    );
                }
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateOrder(Integer accountId, Integer orderId, AddOrderDto dto) {
        Customer customer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
        
        Orders existingOrder = ordersService.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order", orderId));
        
        // Проверяем, что заказ принадлежит заказчику
        if (!existingOrder.getCustomer().getId().equals(customer.getId())) {
            throw new SecurityException("Access denied to order " + orderId);
        }
        
        // Проверяем, что заказ отклонен (можно обновлять только отклоненные заказы)
        if (existingOrder.getStatus() != com.fomov.tasktroveapi.model.OrderStatus.REJECTED) {
            throw new IllegalArgumentException("Можно обновлять только отклоненные заказы");
        }
        
        // Обновляем данные заказа
        existingOrder.setTitle(dto.getTitle());
        existingOrder.setScope(dto.getScope());
        existingOrder.setTechStack(dto.getStackS());
        existingOrder.setDescription(dto.getDescription());
        
        // Сбрасываем статус отклонения и отправляем на повторную проверку
        existingOrder.setStatus(com.fomov.tasktroveapi.model.OrderStatus.ON_REVIEW);
        existingOrder.setPublicationTime(OffsetDateTime.now()); // Обновляем время публикации
        
        ordersService.save(existingOrder);
        
        // Отправляем уведомление всем администраторам о повторной отправке заказа на проверку
        String orderTitle = existingOrder.getTitle() != null ? existingOrder.getTitle() : "Заказ #" + existingOrder.getId();
        String customerName = customer.getFullName() != null ? customer.getFullName() : "Заказчик";
        
        List<Account> allAccounts = accountRepository.findAllWithRole();
        for (Account account : allAccounts) {
            if (account.getRole() != null) {
                String roleName = account.getRole().getName();
                if ("Administrator".equals(roleName) || "SuperAdministrator".equals(roleName)) {
                    notificationService.createOrderReviewNotification(
                        account.getId(),
                        customer.getId(),
                        existingOrder.getId(),
                        orderTitle + " (обновлен)",
                        customerName
                    );
                }
            }
        }
        
        logger.info("Order {} updated and resubmitted for review by customer {}", orderId, accountId);
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
        
        // Для деактивации заказа можно использовать статус или мягкое удаление
        // В данном случае просто сохраняем, статус остается прежним
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
        
        // Нельзя удалять заказ, который в работе (назначен исполнителю)
        if (order.getPerformer() != null) {
            throw new IllegalStateException("Нельзя удалить заказ, который находится в работе. Сначала откажитесь от исполнителя.");
        }
        
        // Помечаем заказ как удаленный заказчиком (мягкое удаление)
        // Заказ остается в базе данных и виден исполнителю в завершенных заказах
        order.setIsDeletedByCustomer(true);
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
        
        // Получаем все отклики на этот заказ
        List<Reply> replies = replyService.findByOrderId(order.getId());
        
        // Находим отклик одобренного исполнителя
        Reply approvedReply = null;
        for (Reply reply : replies) {
            if (reply.getPerformerId().equals(performer.getId())) {
                approvedReply = reply;
                break;
            }
        }
        
        if (approvedReply == null) {
            throw new NotFoundException("Reply from performer " + performer.getId() + " for order " + order.getId() + " not found");
        }
        
        String orderTitle = order.getTitle() != null ? order.getTitle() : "Заказ #" + order.getId();
        String customerName = customer.getFullName() != null ? customer.getFullName() : "Заказчик";
        
        // Сначала сохраняем ID одобренного отклика
        Integer approvedReplyId = approvedReply.getId();
        
        // Отслеживаем, кому уже отправлено уведомление, чтобы не отправлять повторно
        java.util.Set<Integer> notifiedPerformerIds = new java.util.HashSet<>();
        
        // Удаляем все отклики других исполнителей на этот заказ и отправляем им уведомления об отказе
        for (Reply reply : replies) {
            if (!reply.getPerformerId().equals(performer.getId())) {
                // Отправляем уведомление исполнителю об отказе перед удалением отклика
                Performer refusedPerformer = performerService.findById(reply.getPerformerId()).orElse(null);
                if (refusedPerformer != null && refusedPerformer.getAccount() != null) {
                    Integer performerAccountId = refusedPerformer.getAccount().getId();
                    // Отправляем уведомление только если еще не отправляли этому исполнителю
                    if (!notifiedPerformerIds.contains(performerAccountId)) {
                        notificationService.createPerformerNotSelectedNotification(
                            performerAccountId,
                            customer.getId(),
                            order.getId(),
                            orderTitle,
                            customerName
                        );
                        notifiedPerformerIds.add(performerAccountId);
                    }
                }
                replyService.deleteById(reply.getId());
                logger.info("Deleted reply ID: {} from performer ID: {} for order ID: {}", 
                    reply.getId(), reply.getPerformerId(), order.getId());
            }
        }
        
        // Перезагружаем список откликов из БД и удаляем все остальные отклики (если есть), кроме одобренного
        // Это гарантирует, что все отклики, включая те, которые могли появиться параллельно, будут удалены
        List<Reply> remainingReplies = replyService.findByOrderId(order.getId());
        for (Reply reply : remainingReplies) {
            if (!reply.getId().equals(approvedReplyId)) {
                // Отправляем уведомление исполнителю об отказе только если еще не отправляли в первом проходе
                Performer refusedPerformer = performerService.findById(reply.getPerformerId()).orElse(null);
                if (refusedPerformer != null && refusedPerformer.getAccount() != null) {
                    Integer performerAccountId = refusedPerformer.getAccount().getId();
                    // Отправляем уведомление только если еще не отправляли этому исполнителю
                    if (!notifiedPerformerIds.contains(performerAccountId)) {
                        notificationService.createPerformerNotSelectedNotification(
                            performerAccountId,
                            customer.getId(),
                            order.getId(),
                            orderTitle,
                            customerName
                        );
                        notifiedPerformerIds.add(performerAccountId);
                    }
                }
                replyService.deleteById(reply.getId());
                logger.info("Deleted remaining reply ID: {} from performer ID: {} for order ID: {}", 
                    reply.getId(), reply.getPerformerId(), order.getId());
            }
        }
        
        // Устанавливаем флаг одобрения заказчиком для одобренного отклика
        // Перезагружаем одобренный отклик из БД, чтобы убедиться что он все еще существует
        approvedReply = replyService.findById(approvedReplyId)
                .orElseThrow(() -> new IllegalStateException("Approved reply was deleted"));
        approvedReply.setIsApprovedByCustomer(true);
        replyService.save(approvedReply);
        
        // Перезагружаем заказ из БД, чтобы обновить коллекцию replies после удаления
        order = ordersService.findById(dto.getOrderId())
                .orElseThrow(() -> new NotFoundException("Order", dto.getOrderId()));
        
        order.setPerformer(performer);
        order.setStatus(com.fomov.tasktroveapi.model.OrderStatus.IN_PROCESS);
        ordersService.save(order);
        
        // Создаем чат между заказчиком и исполнителем, если его еще нет
        createChatIfNotExists(customer, performer, order);
        
        // Создаем уведомление для исполнителя о принятии в работу
        if (performer.getAccount() != null) {
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
        // Проверяем, существует ли уже чат между этим заказчиком и исполнителем
        // Используем метод без учета флагов удаления, чтобы найти чат даже если он был удален
        List<Chat> existingChats = chatService.findByCustomerIdAndPerformerIdIgnoreDeleted(customer.getId(), performer.getId());
        boolean chatExists = !existingChats.isEmpty();
        
        if (!chatExists) {
        // Формируем roomName для этого конкретного заказа
        String roomName = "Order #" + order.getId() + ": " + 
                         (order.getTitle() != null ? order.getTitle() : "Chat");
        
            Chat chat = new Chat();
            chat.setCustomer(customer);
            chat.setPerformer(performer);
            chat.setRoomName(roomName);
            chat.setCheckByCustomer(false);
            chat.setCheckByPerformer(false);
            chat.setDeletedByCustomer(false);
            chat.setDeletedByPerformer(false);
            chatService.save(chat);
            
            logger.info("Created chat between customer {} and performer {} for order {}", 
                       customer.getId(), performer.getId(), order.getId());
        } else {
            // Если чат уже существует (включая удаленные), восстанавливаем его и обновляем roomName
            Chat existingChat = existingChats.get(0);
            
            // Восстанавливаем чат, если он был удален (сбрасываем флаги удаления)
            boolean wasRestored = false;
            if (Boolean.TRUE.equals(existingChat.getDeletedByCustomer())) {
                existingChat.setDeletedByCustomer(false);
                wasRestored = true;
            }
            if (Boolean.TRUE.equals(existingChat.getDeletedByPerformer())) {
                existingChat.setDeletedByPerformer(false);
                wasRestored = true;
            }
            
            String currentRoomName = existingChat.getRoomName();
            String newOrderTitle = order.getTitle() != null ? order.getTitle() : "Chat";
            String newOrderPart = "Order #" + order.getId() + ": " + newOrderTitle;
            
            // Проверяем, не добавлен ли уже этот проект
            if (!currentRoomName.contains(newOrderPart)) {
                // Добавляем новый проект через запятую
                String updatedRoomName = currentRoomName + ", " + newOrderPart;
                // Ограничиваем длину до 100 символов (ограничение в БД)
                if (updatedRoomName.length() > 100) {
                    updatedRoomName = updatedRoomName.substring(0, 97) + "...";
                }
                existingChat.setRoomName(updatedRoomName);
            }
            
            chatService.save(existingChat);
            
            if (wasRestored) {
                logger.info("Restored and updated chat between customer {} and performer {} for order {}", 
                           customer.getId(), performer.getId(), order.getId());
            } else {
                logger.info("Updated chat roomName for existing chat between customer {} and performer {}, added order {}", 
                           customer.getId(), performer.getId(), order.getId());
            }
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
            if (dto.getIsDone()) {
                order.setStatus(com.fomov.tasktroveapi.model.OrderStatus.DONE);
                if (order.getPerformer() != null) {
                    replyUpdateService.updateReplyOnOrderCompletion(order.getId(), order.getPerformer().getId());
                    
                    // Создаем уведомление для исполнителя о том, что заказчик завершил заказ
                    String orderTitle = order.getTitle() != null ? order.getTitle() : "Заказ #" + order.getId();
                    String customerName = customer.getFullName() != null ? customer.getFullName() : "Заказчик";
                    if (order.getPerformer().getAccount() != null) {
                        notificationService.createOrderCompletedByCustomerNotification(
                            order.getPerformer().getAccount().getId(),
                            customer.getId(),
                            order.getId(),
                            orderTitle,
                            customerName
                        );
                    }
                }
            } else {
                // Если заказ не завершен, возвращаем его в процесс
                if (order.getPerformer() != null) {
                    order.setStatus(com.fomov.tasktroveapi.model.OrderStatus.IN_PROCESS);
                } else {
                    order.setStatus(com.fomov.tasktroveapi.model.OrderStatus.ACTIVE);
                }
            }
        }
        
        if (dto.getIsOnCheck() != null) {
            if (dto.getIsOnCheck()) {
                order.setStatus(com.fomov.tasktroveapi.model.OrderStatus.ON_CHECK);
            } else if (order.getPerformer() != null) {
                order.setStatus(com.fomov.tasktroveapi.model.OrderStatus.IN_PROCESS);
            }
        }
        
        ordersService.save(order);
    }

    @Override
    public void addReview(Integer accountId, WorkExperienceDto dto) {
        Customer customer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
        
        // Проверяем, что заказ существует и завершен
        Orders order = null;
        if (dto.getOrderId() != null) {
            order = ordersService.findById(dto.getOrderId())
                    .orElseThrow(() -> new NotFoundException("Order", dto.getOrderId()));
            
            // Проверяем, что заказ завершен
            if (order.getStatus() != com.fomov.tasktroveapi.model.OrderStatus.DONE) {
                throw new IllegalStateException("Cannot add review for order that is not completed");
            }
            
            // Проверяем, что заказ принадлежит текущему заказчику
            if (!order.getCustomer().getId().equals(customer.getId())) {
                throw new SecurityException("Access denied to order " + dto.getOrderId());
            }
            
            // Проверяем, что заказ имеет исполнителя
            if (order.getPerformer() == null) {
                throw new IllegalStateException("Order does not have a performer assigned");
            }
        }
        
        // Получаем исполнителя: если заказ указан, используем исполнителя из заказа
        // Это более надежно, чем поиск по ID из DTO
        Performer performer;
        if (order != null && order.getPerformer() != null) {
            // Используем исполнителя из заказа - это гарантирует, что отзыв оставляется правильному исполнителю
            performer = order.getPerformer();
        } else {
            // Если заказ не указан, ищем исполнителя по ID из DTO
            Integer performerIdFromDto = dto.getPerformerId();
            if (performerIdFromDto == null || performerIdFromDto == 0) {
                throw new IllegalArgumentException("Performer ID is required when order is not specified");
            }
            performer = performerService.findById(performerIdFromDto)
                    .orElseThrow(() -> new NotFoundException("Performer", performerIdFromDto));
        }
        
        WorkExperience workExperience = workExperienceMapper.toEntity(dto);
        workExperience.setCustomer(customer);
        workExperience.setPerformer(performer);
        workExperience.setReviewerType(ReviewerType.CUSTOMER); // Заказчик оставляет отзыв об исполнителе
        workExperience.setOrder(order);
        workExperienceService.save(workExperience);
        
        // Создаем уведомление для исполнителя о том, что его оценили
        if (performer.getAccount() != null) {
            String orderTitle = order != null && order.getTitle() != null ? order.getTitle() : "заказ #" + (order != null ? order.getId() : "");
            String customerName = customer.getFullName() != null ? customer.getFullName() : "Заказчик";
            Integer mark = dto.getRate() != null ? dto.getRate() : 5;
            Integer orderId = order != null ? order.getId() : null;
            notificationService.createReviewNotification(
                performer.getAccount().getId(),
                customer.getId(),
                orderId,
                orderTitle,
                customerName,
                mark
            );
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void sendEmailToPerformer(Integer accountId, Integer orderId, Integer performerId,
                                    String text, MultipartFile document, Boolean isCorrection) {
        Customer customer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
        
        Orders order = null;
        Performer performer = null;
        
        if (orderId != null) {
            order = ordersService.findById(orderId).orElse(null);
            if (order != null && !order.getCustomer().getId().equals(customer.getId())) {
                throw new SecurityException("Access denied to order " + orderId);
            }
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
        
        if (isCorrection != null && isCorrection && order != null && performerId != null) {
            handleCorrection(order, orderId, performerId);
            
            // Создаем уведомление для исполнителя о правках
            if (performer != null && performer.getAccount() != null) {
                String orderTitle = order.getTitle() != null ? order.getTitle() : "Заказ #" + order.getId();
                String customerName = customer.getFullName() != null ? customer.getFullName() : "Заказчик";
                notificationService.createCorrectionNotification(
                    performer.getAccount().getId(),
                    customer.getId(),
                    order.getId(),
                    orderTitle,
                    customerName
                );
            }
        } else if (order != null && (isCorrection == null || !isCorrection)) {
            // Проверяем, что исполнитель уже одобрен для этого заказа
            if (order.getPerformer() != null && performerId != null && 
                order.getPerformer().getId().equals(performerId)) {
                // Если это не исправление и исполнитель одобрен, то устанавливаем флаг отправки ТЗ
            order.setIsSpecSent(true);
            ordersService.save(order);
            } else {
                throw new IllegalStateException("Нельзя отправить ТЗ до одобрения исполнителя");
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
        String customerName = customer.getFullName() != null ? customer.getFullName() : "Заказчик";
        String performerName = performer != null && performer.getFullName() != null 
                ? performer.getFullName() : "Исполнитель";
        
        // Удаляем все отклики для этого заказа, чтобы при возврате в статус ACTIVE заказ был "чистым"
        // Исполнители смогут откликнуться заново
        replyService.deleteAllByOrderId(orderId);
        logger.info("Deleted all replies for order {} after refusing performer {}", orderId, performerId);
        
        order = ordersService.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order", orderId));
        
        order.setPerformer(null);
        order.setStatus(com.fomov.tasktroveapi.model.OrderStatus.ACTIVE);
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
        
        // Проверяем, что чат принадлежит этому заказчику
        if (!chat.getCustomerId().equals(customer.getId())) {
            throw new SecurityException("Access denied to chat " + chatId);
        }
        
        // Помечаем чат как удаленный для заказчика (мягкое удаление - чат скрыт только для заказчика)
        chat.setDeletedByCustomer(true);
        chatService.save(chat);
        
        logger.info("Chat {} deleted by customer {} (soft delete)", chatId, customer.getId());
    }
    
    private Integer extractOrderIdFromRoomName(String roomName) {
        if (roomName == null || !roomName.contains("Order #")) {
            return null;
        }
        try {
            // Формат может быть: "Order #14: Название" или "Order #14: Название, Order #15: Название2"
            // Извлекаем первый orderId из строки
            int orderIndex = roomName.indexOf("Order #");
            if (orderIndex >= 0) {
                String remaining = roomName.substring(orderIndex + "Order #".length());
                // Ищем конец числа (пробел, двоеточие или запятая)
                StringBuilder idStr = new StringBuilder();
                for (char c : remaining.toCharArray()) {
                    if (Character.isDigit(c)) {
                        idStr.append(c);
                    } else {
                        break;
                    }
                }
                if (idStr.length() > 0) {
                    return Integer.parseInt(idStr.toString());
                }
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
            String customerName = order.getCustomer().getFullName() != null 
                    ? order.getCustomer().getFullName() 
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
        order.setStatus(com.fomov.tasktroveapi.model.OrderStatus.IN_PROCESS);
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

    @Override
    @Transactional(readOnly = true)
    public Customer getPortfolio(Integer accountId) {
        return repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updatePortfolio(Integer accountId, UpdateCustomerPortfolioDto dto) {
        Customer customer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
        
        // Обновляем ФИО в Customer
        customer.setLastName(dto.getLastName());
        customer.setFirstName(dto.getFirstName());
        customer.setMiddleName(dto.getMiddleName());
        
        // Используем PortfolioService для обновления портфолио
        portfolioService.updatePortfolio(customer.getId(), dto, "CUSTOMER");
        
        repository.save(customer);
        // Явно вызываем flush, чтобы убедиться, что изменения сохранены
        repository.flush();
        logger.info("Customer portfolio updated for accountId: {}", accountId);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getMyReviews(Integer accountId) {
        Customer customer = repository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Customer", accountId));
        
        // Получаем только отзывы О заказчике от исполнителей (reviewerType = PERFORMER)
        List<WorkExperience> reviews = workExperienceService.findReviewsAboutCustomer(customer.getId());
        List<WorkExperienceDto> reviewDtos = reviews.stream()
                .map(workExperienceMapper::toDto)
                .collect(Collectors.toList());
        
        return Map.of("reviews", reviewDtos);
    }
}
