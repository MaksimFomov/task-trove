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
    @Mapping(target = "techStack", ignore = true)
    Orders toEntity(AddOrderDto dto);
    
    @Mapping(target = "customerName", ignore = true)
    @Mapping(target = "performerName", ignore = true)
    @Mapping(target = "replies", ignore = true)
    @Mapping(target = "custOfOrder", ignore = true)
    @Mapping(target = "howReplies", ignore = true)
    @Mapping(target = "stackS", source = "techStack")
    @Mapping(target = "actived", source = "isActived")
    @Mapping(target = "inProcess", source = "isInProcess")
    @Mapping(target = "onCheck", source = "isOnCheck")
    @Mapping(target = "done", source = "isDone")
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
        // Маппинг stackS -> techStack
        if (dto.getStackS() != null && orders.getTechStack() == null) {
            orders.setTechStack(dto.getStackS());
        }
    }
    
    @AfterMapping
    default void afterMappingToDto(@MappingTarget AddOrderDto dto, Orders orders) {
        // Заполняем имена из связанных сущностей
        try {
            if (orders.getCustomer() != null) {
                dto.setCustomerName(orders.getCustomer().getName());
                dto.setCustomerId(orders.getCustomer().getId());
            }
        } catch (Exception e) {
            // Lazy loading exception - игнорируем
        }
        try {
            if (orders.getPerformer() != null) {
                dto.setPerformerName(orders.getPerformer().getName());
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
    }
}
