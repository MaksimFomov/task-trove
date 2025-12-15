package com.fomov.tasktroveapi.service.impl;

import com.fomov.tasktroveapi.model.Reply;
import com.fomov.tasktroveapi.service.ReplyService;
import com.fomov.tasktroveapi.service.ReplyUpdateService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ReplyUpdateServiceImpl implements ReplyUpdateService {

    private static final Logger logger = LoggerFactory.getLogger(ReplyUpdateServiceImpl.class);

    private final ReplyService replyService;

    public ReplyUpdateServiceImpl(ReplyService replyService) {
        this.replyService = replyService;
    }

    @Override
    @Deprecated
    public int updateReplyOnPerformerAssignment(Integer orderId, Integer performerId) {
        // Флаги удалены, статус определяется через Order.status и Order.performer_id
        logger.debug("updateReplyOnPerformerAssignment called but no longer needed - status is determined by Order.status");
        return 0;
    }

    @Override
    @Deprecated
    public void updateReplyOnTaskCompletion(Integer orderId, Integer performerId) {
        // Флаги удалены, статус определяется через Order.status
        logger.debug("updateReplyOnTaskCompletion called but no longer needed - status is determined by Order.status");
    }

    @Override
    @Deprecated
    public void updateReplyOnOrderCompletion(Integer orderId, Integer performerId) {
        // Флаги удалены, статус определяется через Order.status
        logger.debug("updateReplyOnOrderCompletion called but no longer needed - status is determined by Order.status");
    }

    @Override
    @Deprecated
    public void resetReplyOnCorrection(Integer orderId, Integer performerId) {
        // Флаги удалены, статус определяется через Order.status
        logger.debug("resetReplyOnCorrection called but no longer needed - status is determined by Order.status");
    }
}
