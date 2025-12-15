package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.dto.ReplyDto;
import com.fomov.tasktroveapi.model.OrderStatus;
import com.fomov.tasktroveapi.model.Reply;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.AfterMapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ReplyMapper {
    
    @Mapping(target = "orderNameByOrder", ignore = true)
    @Mapping(target = "perfName", ignore = true)
    @Mapping(target = "isDoneThisTask", ignore = true) // Computed from Order.status
    @Mapping(target = "isOnCustomer", ignore = true) // Computed from Order.performer_id
    @Mapping(target = "donned", ignore = true) // Computed from Order.status
    @Mapping(target = "orderName", source = "orders.title")
    @Mapping(target = "orderId", source = "orders.id")
    @Mapping(target = "performerId", source = "performer.id")
    @Mapping(target = "orderDescription", ignore = true)
    @Mapping(target = "orderScope", ignore = true)
    @Mapping(target = "orderStackS", ignore = true)
    @Mapping(target = "orderPublicationTime", ignore = true)
    @Mapping(target = "orderHowReplies", ignore = true)
    ReplyDto toDto(Reply reply);
    
    @Mapping(target = "orders", ignore = true)
    @Mapping(target = "performer", ignore = true)
    Reply toEntity(ReplyDto dto);
    
    @AfterMapping
    default void afterMappingToDto(@MappingTarget ReplyDto dto, Reply reply) {
        if (reply.getOrders() != null) {
            var order = reply.getOrders();
            
            // isOnCustomer: true если заказ назначен на исполнителя из отклика
            dto.setIsOnCustomer(order.getPerformer() != null && 
                               reply.getPerformerId() != null &&
                               order.getPerformer().getId().equals(reply.getPerformerId()));
            
            // isDoneThisTask: true если заказ на проверке (ON_CHECK) или завершен (DONE)
            dto.setIsDoneThisTask(order.getStatus() == OrderStatus.ON_CHECK || 
                                 order.getStatus() == OrderStatus.DONE);
            
            // donned: true если заказ завершен (DONE)
            dto.setDonned(order.getStatus() == OrderStatus.DONE);
            
            // Дополнительные поля из заказа
            dto.setOrderNameByOrder(order.getTitle());
            dto.setOrderDescription(order.getDescription());
            dto.setOrderScope(order.getScope());
            dto.setOrderStackS(order.getTechStack());
            if (order.getPublicationTime() != null) {
                dto.setOrderPublicationTime(order.getPublicationTime().toString());
            }
            if (order.getReplies() != null) {
                dto.setOrderHowReplies(order.getReplies().size());
            }
        }
        
        // Имя исполнителя
        if (reply.getPerformer() != null) {
            dto.setPerfName(reply.getPerformer().getFullName());
        }
    }
}

