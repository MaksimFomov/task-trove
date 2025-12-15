package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.model.OrderStatus;
import com.fomov.tasktroveapi.model.Orders;
import com.fomov.tasktroveapi.dto.AddOrderDto;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface OrdersMapper {
    
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "performer", ignore = true)
    @Mapping(target = "replies", ignore = true)
    @Mapping(target = "replyBind", ignore = true)
    @Mapping(target = "publicationTime", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "techStack", ignore = true)
    Orders toEntity(AddOrderDto dto);
    
    @Mapping(target = "customerName", ignore = true)
    @Mapping(target = "performerName", ignore = true)
    @Mapping(target = "customerEmail", ignore = true)
    @Mapping(target = "performerEmail", ignore = true)
    @Mapping(target = "replies", ignore = true)
    @Mapping(target = "custOfOrder", ignore = true)
    @Mapping(target = "howReplies", ignore = true)
    @Mapping(target = "stackS", source = "techStack")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "actived", ignore = true)
    @Mapping(target = "inProcess", ignore = true)
    @Mapping(target = "onCheck", ignore = true)
    @Mapping(target = "done", ignore = true)
    @Mapping(target = "onReview", ignore = true)
    @Mapping(target = "rejected", ignore = true)
    AddOrderDto toDto(Orders entity);
    
    @AfterMapping
    default void afterMappingToEntity(@MappingTarget Orders orders, AddOrderDto dto) {
        // Устанавливаем значения по умолчанию если они не заданы
        if (orders.getPublicationTime() == null) {
            orders.setPublicationTime(java.time.OffsetDateTime.now());
        }
        if (orders.getReplyBind() == null) {
            orders.setReplyBind(0);
        }
        // Маппинг status из DTO или из boolean полей для обратной совместимости
        if (dto.getStatus() != null && !dto.getStatus().isEmpty()) {
            try {
                orders.setStatus(OrderStatus.valueOf(dto.getStatus()));
            } catch (IllegalArgumentException e) {
                // Если статус невалидный, используем значения по умолчанию
                orders.setStatus(OrderStatus.ACTIVE);
            }
        } else {
            // Обратная совместимость: маппинг из boolean полей
            if (dto.isRejected()) {
                orders.setStatus(OrderStatus.REJECTED);
            } else if (dto.isDone()) {
                orders.setStatus(OrderStatus.DONE);
            } else if (dto.isOnReview()) {
                orders.setStatus(OrderStatus.ON_REVIEW);
            } else if (dto.isOnCheck()) {
                orders.setStatus(OrderStatus.ON_CHECK);
            } else if (dto.isInProcess()) {
                orders.setStatus(OrderStatus.IN_PROCESS);
            } else {
                orders.setStatus(OrderStatus.ACTIVE);
            }
        }
        // Маппинг stackS -> techStack
        if (dto.getStackS() != null && orders.getTechStack() == null) {
            orders.setTechStack(dto.getStackS());
        }
    }
    
    @AfterMapping
    default void afterMappingToDto(@MappingTarget AddOrderDto dto, Orders orders) {
        // Заполняем ФИО и email из связанных сущностей
        try {
            if (orders.getCustomer() != null) {
                // Используем ФИО для customerName
                String customerFullName = orders.getCustomer().getFullName();
                dto.setCustomerName(customerFullName != null ? customerFullName : "");
                // Используем email из связанного Account
                String customerEmail = null;
                if (orders.getCustomer().getAccount() != null) {
                    customerEmail = orders.getCustomer().getAccount().getEmail();
                }
                dto.setCustomerEmail(customerEmail != null ? customerEmail : "");
                // Используем customer.id (не accountId), так как методы поиска используют customer.id
                    dto.setCustomerId(orders.getCustomer().getId());
            }
        } catch (Exception e) {
            // Lazy loading exception - игнорируем
        }
        try {
            if (orders.getPerformer() != null) {
                // Используем ФИО для performerName
                String performerFullName = orders.getPerformer().getFullName();
                dto.setPerformerName(performerFullName != null ? performerFullName : "");
                // Используем email из связанного Account
                String performerEmail = null;
                if (orders.getPerformer().getAccount() != null) {
                    performerEmail = orders.getPerformer().getAccount().getEmail();
                }
                dto.setPerformerEmail(performerEmail != null ? performerEmail : "");
                // Используем performer.id (не accountId), так как методы поиска используют performer.id
                    dto.setPerformerId(orders.getPerformer().getId());
            }
        } catch (Exception e) {
            // Lazy loading exception - игнорируем
        }
        // Устанавливаем количество replies
        try {
            if (orders.getReplies() != null) {
                dto.setHowReplies(orders.getReplies().size());
            } else {
                dto.setHowReplies(0);
            }
        } catch (Exception e) {
            // Если коллекция не инициализирована (lazy loading), устанавливаем 0
            dto.setHowReplies(0);
        }
        // Маппинг techStack -> stackS для обратной совместимости
        if (orders.getTechStack() != null && dto.getStackS() == null) {
            dto.setStackS(orders.getTechStack());
        }
        // Маппинг status в строку
        if (orders.getStatus() != null) {
            dto.setStatus(orders.getStatus().name());
        }
        // Маппинг boolean полей из Orders в AddOrderDto для обратной совместимости
        if (orders.getStatus() != null) {
            dto.setActived(orders.getStatus() == OrderStatus.ACTIVE);
            dto.setInProcess(orders.getStatus() == OrderStatus.IN_PROCESS);
            dto.setOnCheck(orders.getStatus() == OrderStatus.ON_CHECK);
            dto.setDone(orders.getStatus() == OrderStatus.DONE);
            dto.setOnReview(orders.getStatus() == OrderStatus.ON_REVIEW);
            dto.setRejected(orders.getStatus() == OrderStatus.REJECTED);
        }
    }
}
