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
    public int updateReplyOnPerformerAssignment(Integer orderId, Integer performerId) {
        logger.info("Updating reply for orderId={}, performerId={}", orderId, performerId);
        int updatedRows = replyService.updateIsOnCustomerByOrderIdAndPerformerId(orderId, performerId);
        logger.info("Updated rows: {}", updatedRows);
        
        if (updatedRows == 0) {
            logger.error("Reply not found for performer {} and order {}", performerId, orderId);
            List<Reply> allReplies = replyService.findByOrderId(orderId);
            logger.info("Total replies for order {}: {}", orderId, allReplies.size());
            for (Reply r : allReplies) {
                logger.info("Reply id={}, performerId={}, orderId={}", r.getId(), r.getPerformerId(), r.getOrderId());
            }
        }
        
        return updatedRows;
    }

    @Override
    public void updateReplyOnTaskCompletion(Integer orderId, Integer performerId) {
        logger.info("Marking task as done for orderId={}, performerId={}", orderId, performerId);
        List<Reply> replies = replyService.findByOrderId(orderId);
        for (Reply reply : replies) {
            if (reply.getPerformerId().equals(performerId)) {
                reply.setIsDoneThisTask(true);
                replyService.save(reply);
                logger.info("Reply {} marked as done", reply.getId());
                break;
            }
        }
    }

    @Override
    public void updateReplyOnOrderCompletion(Integer orderId, Integer performerId) {
        logger.info("Marking order as completed for orderId={}, performerId={}", orderId, performerId);
        List<Reply> replies = replyService.findByOrderId(orderId);
        for (Reply reply : replies) {
            if (reply.getPerformerId().equals(performerId)) {
                reply.setDonned(true);
                reply.setIsDoneThisTask(false);
                replyService.save(reply);
                logger.info("Reply {} marked as completed", reply.getId());
                break;
            }
        }
    }

    @Override
    public void resetReplyOnCorrection(Integer orderId, Integer performerId) {
        logger.info("Resetting reply status for corrections: orderId={}, performerId={}", orderId, performerId);
        List<Reply> replies = replyService.findByOrderId(orderId);
        for (Reply reply : replies) {
            if (reply.getPerformerId().equals(performerId)) {
                reply.setIsDoneThisTask(false);
                replyService.save(reply);
                logger.info("Reply {} reset for corrections", reply.getId());
                break;
            }
        }
    }
}
