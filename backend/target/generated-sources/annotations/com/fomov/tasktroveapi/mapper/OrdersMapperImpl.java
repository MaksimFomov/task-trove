package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.dto.AddOrderDto;
import com.fomov.tasktroveapi.model.Orders;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-12-12T23:27:06+0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 25 (Homebrew)"
)
@Component
public class OrdersMapperImpl implements OrdersMapper {

    @Override
    public Orders toEntity(AddOrderDto dto) {
        if ( dto == null ) {
            return null;
        }

        Orders orders = new Orders();

        orders.setStackS( dto.getStackS() );
        orders.setId( dto.getId() );
        orders.setTitle( dto.getTitle() );
        orders.setScope( dto.getScope() );
        orders.setDescription( dto.getDescription() );
        orders.setStartTime( dto.getStartTime() );
        orders.setEndTime( dto.getEndTime() );
        orders.setDocumentName( dto.getDocumentName() );
        orders.setResultLink( dto.getResultLink() );

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
        if ( entity.getIsActived() != null ) {
            addOrderDto.setActived( entity.getIsActived() );
        }
        if ( entity.getIsInProcess() != null ) {
            addOrderDto.setInProcess( entity.getIsInProcess() );
        }
        if ( entity.getIsOnCheck() != null ) {
            addOrderDto.setOnCheck( entity.getIsOnCheck() );
        }
        if ( entity.getIsDone() != null ) {
            addOrderDto.setDone( entity.getIsDone() );
        }
        if ( entity.getIsOnReview() != null ) {
            addOrderDto.setOnReview( entity.getIsOnReview() );
        }
        if ( entity.getIsRejected() != null ) {
            addOrderDto.setRejected( entity.getIsRejected() );
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
        addOrderDto.setDocumentName( entity.getDocumentName() );
        addOrderDto.setResultLink( entity.getResultLink() );
        addOrderDto.setReplyBind( entity.getReplyBind() );

        afterMappingToDto( addOrderDto, entity );

        return addOrderDto;
    }
}
