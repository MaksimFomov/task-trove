package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.dto.ReplyDto;
import com.fomov.tasktroveapi.model.Orders;
import com.fomov.tasktroveapi.model.Performer;
import com.fomov.tasktroveapi.model.Reply;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-12-03T19:36:34+0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 25 (Homebrew)"
)
@Component
public class ReplyMapperImpl implements ReplyMapper {

    @Override
    public ReplyDto toDto(Reply reply) {
        if ( reply == null ) {
            return null;
        }

        ReplyDto replyDto = new ReplyDto();

        replyDto.setOrderName( replyOrdersTitle( reply ) );
        replyDto.setOrderId( replyOrdersId( reply ) );
        replyDto.setPerformerId( replyPerformerId( reply ) );
        replyDto.setId( reply.getId() );
        replyDto.setIsDoneThisTask( reply.getIsDoneThisTask() );
        replyDto.setIsOnCustomer( reply.getIsOnCustomer() );
        replyDto.setDonned( reply.getDonned() );
        replyDto.setWorkBind( reply.getWorkBind() );

        return replyDto;
    }

    @Override
    public Reply toEntity(ReplyDto dto) {
        if ( dto == null ) {
            return null;
        }

        Reply reply = new Reply();

        reply.setId( dto.getId() );
        reply.setIsDoneThisTask( dto.getIsDoneThisTask() );
        reply.setIsOnCustomer( dto.getIsOnCustomer() );
        reply.setDonned( dto.getDonned() );
        reply.setWorkBind( dto.getWorkBind() );

        return reply;
    }

    private String replyOrdersTitle(Reply reply) {
        Orders orders = reply.getOrders();
        if ( orders == null ) {
            return null;
        }
        return orders.getTitle();
    }

    private Integer replyOrdersId(Reply reply) {
        Orders orders = reply.getOrders();
        if ( orders == null ) {
            return null;
        }
        return orders.getId();
    }

    private Integer replyPerformerId(Reply reply) {
        Performer performer = reply.getPerformer();
        if ( performer == null ) {
            return null;
        }
        return performer.getId();
    }
}
