package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.dto.ReplyDto;
import com.fomov.tasktroveapi.model.Reply;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.AfterMapping;

@Mapper(componentModel = "spring")
public interface ReplyMapper {
    
    @Mapping(target = "orderNameByOrder", ignore = true)
    @Mapping(target = "perfName", ignore = true)
    @Mapping(target = "orderName", source = "orders.title")
    @Mapping(target = "orderId", source = "orders.id")
    @Mapping(target = "performerId", source = "performer.id")
    ReplyDto toDto(Reply reply);
    
    @Mapping(target = "orders", ignore = true)
    @Mapping(target = "performer", ignore = true)
    Reply toEntity(ReplyDto dto);
}

