package com.fomov.tasktroveapi.mapper;

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
    @Mapping(target = "isActived", ignore = true)
    @Mapping(target = "isInProcess", ignore = true)
    @Mapping(target = "isOnCheck", ignore = true)
    @Mapping(target = "isDone", ignore = true)
    @Mapping(target = "isOnReview", ignore = true)
    @Mapping(target = "isRejected", ignore = true)
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
    @Mapping(target = "actived", source = "isActived")
    @Mapping(target = "inProcess", source = "isInProcess")
    @Mapping(target = "onCheck", source = "isOnCheck")
    @Mapping(target = "done", source = "isDone")
    @Mapping(target = "onReview", source = "isOnReview")
    @Mapping(target = "rejected", source = "isRejected")
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
        if (orders.getIsActived() == null) {
            orders.setIsActived(true);
        }
        if (orders.getIsInProcess() == null) {
            orders.setIsInProcess(false);
        }
        if (orders.getIsOnCheck() == null) {
            orders.setIsOnCheck(false);
        }
        if (orders.getIsDone() == null) {
            orders.setIsDone(false);
        }
        if (orders.getIsOnReview() == null) {
            orders.setIsOnReview(false);
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
                // Используем accountId вместо customerId для правильной работы getUserDetails
                if (orders.getCustomer().getAccount() != null) {
                    dto.setCustomerId(orders.getCustomer().getAccount().getId());
                } else {
                    dto.setCustomerId(orders.getCustomer().getId());
                }
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
                // Используем accountId вместо performerId для правильной работы getUserDetails
                if (orders.getPerformer().getAccount() != null) {
                    dto.setPerformerId(orders.getPerformer().getAccount().getId());
                } else {
                    dto.setPerformerId(orders.getPerformer().getId());
                }
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
        // Маппинг boolean полей из Orders в AddOrderDto
        // Значения уже установлены через @Mapping аннотации выше
        if (orders.getIsActived() != null) {
            dto.setActived(orders.getIsActived());
        }
        if (orders.getIsInProcess() != null) {
            dto.setInProcess(orders.getIsInProcess());
        }
        if (orders.getIsOnCheck() != null) {
            dto.setOnCheck(orders.getIsOnCheck());
        }
        if (orders.getIsDone() != null) {
            dto.setDone(orders.getIsDone());
        }
        if (orders.getIsOnReview() != null) {
            dto.setOnReview(orders.getIsOnReview());
        }
        if (orders.getIsRejected() != null) {
            dto.setRejected(orders.getIsRejected());
        }
    }
}
