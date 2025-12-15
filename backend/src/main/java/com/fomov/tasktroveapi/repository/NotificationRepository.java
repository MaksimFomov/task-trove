package com.fomov.tasktroveapi.repository;

import com.fomov.tasktroveapi.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    
    @Query("SELECT n FROM Notification n WHERE n.account.id = :accountId ORDER BY n.createdAt DESC")
    List<Notification> findByAccountIdOrderByCreatedAtDesc(@Param("accountId") Integer accountId);
    
    @Query("SELECT n FROM Notification n WHERE n.account.id = :accountId AND n.isRead = :isRead ORDER BY n.createdAt DESC")
    List<Notification> findByAccountIdAndIsReadOrderByCreatedAtDesc(@Param("accountId") Integer accountId, @Param("isRead") Boolean isRead);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.account.id = :accountId AND n.isRead = false")
    Long countUnreadByAccountId(@Param("accountId") Integer accountId);
}

