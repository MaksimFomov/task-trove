package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.dto.AddOrderDto;
import com.fomov.tasktroveapi.model.Orders;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-12-21T15:22:25+0300",
    comments = "version: 1.6.3, compiler: Eclipse JDT (IDE) 3.44.0.v20251118-1623, environment: Java 21.0.9 (Eclipse Adoptium)"
)
@Component
public class OrdersMapperImpl implements OrdersMapper {

    @Override
    public Orders toEntity(AddOrderDto dto) {
        if ( dto == null ) {
            return null;
        }

        Orders orders = new Orders();

        orders.setBudget( dto.getBudget() );
        orders.setDescription( dto.getDescription() );
        orders.setEndTime( dto.getEndTime() );
        orders.setId( dto.getId() );
        orders.setIsSpecSent( dto.getIsSpecSent() );
        orders.setScope( dto.getScope() );
        orders.setStartTime( dto.getStartTime() );
        orders.setTitle( dto.getTitle() );
        orders.setStackS( dto.getStackS() );

        afterMappingToEntity( orders, dto );

        return orders;
    }

    @Override
    public AddOrderDto toDto(Orders entity) {
        if ( entity == null ) {
            return null;
        }

        AddOrderDto addOrderDto = new AddOrderDto();

        addOrderDto.setStackS( entity.getTechStack() );
        if ( entity.getStatus() != null ) {
            addOrderDto.setStatus( entity.getStatus().name() );
        }
        addOrderDto.setId( entity.getId() );
        addOrderDto.setTitle( entity.getTitle() );
        addOrderDto.setDescription( entity.getDescription() );
        addOrderDto.setScope( entity.getScope() );
        addOrderDto.setCustomerId( entity.getCustomerId() );
        addOrderDto.setPerformerId( entity.getPerformerId() );
        addOrderDto.setPublicationTime( entity.getPublicationTime() );
        addOrderDto.setStartTime( entity.getStartTime() );
        addOrderDto.setEndTime( entity.getEndTime() );
        addOrderDto.setBudget( entity.getBudget() );
        addOrderDto.setIsSpecSent( entity.getIsSpecSent() );
        addOrderDto.setReplyBind( entity.getReplyBind() );

        afterMappingToDto( addOrderDto, entity );

        return addOrderDto;
    }
}
