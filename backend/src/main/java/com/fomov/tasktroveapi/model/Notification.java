package com.fomov.tasktroveapi.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.proxy.HibernateProxy;

import java.time.OffsetDateTime;
import java.util.Objects;

@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notifications_account_id", columnList = "account_id"),
    @Index(name = "idx_notifications_is_read", columnList = "is_read"),
    @Index(name = "idx_notifications_created_at", columnList = "created_at")
})
@Getter
@Setter
@ToString
@NoArgsConstructor
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "account_id", nullable = false)
    private Integer accountId; // ID пользователя (Account.id)
    
    @Column(name = "user_role", nullable = false, length = 20)
    private String userRole; // "Customer", "Performer", "Administrator"
    
    @Column(name = "type", nullable = false, length = 50)
    private String type; // "REPLY", "ASSIGNED", "COMPLETED", "CORRECTION", "REFUSED", "MESSAGE", etc.
    
    @Column(name = "title", nullable = false, length = 255)
    private String title;
    
    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;
    
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;
    
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "related_order_id")
    private Integer relatedOrderId; // ID связанного заказа (если применимо)
    
    @Column(name = "related_performer_id")
    private Integer relatedPerformerId; // ID связанного исполнителя (если применимо)
    
    @Column(name = "related_customer_id")
    private Integer relatedCustomerId; // ID связанного заказчика (если применимо)
    
    @PrePersist
    private void init() {
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now();
        }
        if (this.isRead == null) {
            this.isRead = false;
        }
    }
    
    public Notification(Integer accountId, String userRole, String type, String title, String message) {
        this.accountId = accountId;
        this.userRole = userRole;
        this.type = type;
        this.title = title;
        this.message = message;
        this.createdAt = OffsetDateTime.now();
        this.isRead = false;
    }

    @Override
    public final boolean equals(Object o) {
        if (this == o) return true;
        if (o == null) return false;
        Class<?> oEffectiveClass = o instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass() : o.getClass();
        Class<?> thisEffectiveClass = this instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass() : this.getClass();
        if (thisEffectiveClass != oEffectiveClass) return false;
        Notification notification = (Notification) o;
        return getId() != null && Objects.equals(getId(), notification.getId());
    }

    @Override
    public final int hashCode() {
        return this instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass().hashCode() : getClass().hashCode();
    }
}

