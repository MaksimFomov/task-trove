package com.fomov.tasktroveapi.repository;

import com.fomov.tasktroveapi.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    
    List<Notification> findByAccountIdOrderByCreatedAtDesc(Integer accountId);
    
    List<Notification> findByAccountIdAndIsReadOrderByCreatedAtDesc(Integer accountId, Boolean isRead);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.accountId = :accountId AND n.isRead = false")
    Long countUnreadByAccountId(@Param("accountId") Integer accountId);
}

