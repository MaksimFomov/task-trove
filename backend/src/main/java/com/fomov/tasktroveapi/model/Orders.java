package com.fomov.tasktroveapi.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.proxy.HibernateProxy;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_orders_customer_id", columnList = "customer_id"),
    @Index(name = "idx_orders_performer_id", columnList = "performer_id"),
    @Index(name = "idx_orders_publication_time", columnList = "publication_time"),
    @Index(name = "idx_orders_status", columnList = "status"),
    @Index(name = "idx_orders_title", columnList = "title")
})
@Getter
@Setter
@ToString
@NoArgsConstructor
public class Orders {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(nullable = false, length = 255)
    private String title;
    
    @Column(nullable = false, length = 255)
    private String scope;
    
    @Column(name = "stack_s", length = 255)
    private String techStack; // Переименовано из stackS для ясности
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_orders_customer"))
    @ToString.Exclude
    private Customer customer;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performer_id", nullable = true,
                foreignKey = @ForeignKey(name = "fk_orders_performer"))
    @ToString.Exclude
    private Performer performer;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OrderStatus status = OrderStatus.ACTIVE;
    
    @Column(name = "is_deleted_by_customer", nullable = false)
    private Boolean isDeletedByCustomer = false;
    
    @Column(name = "publication_time", nullable = false)
    private OffsetDateTime publicationTime;
    
    @Column(name = "start_time")
    private OffsetDateTime startTime;
    
    @Column(name = "end_time")
    private OffsetDateTime endTime;
    
    @Column(name = "budget", precision = 15, scale = 2)
    private java.math.BigDecimal budget;
    
    @Column(name = "is_spec_sent", nullable = false)
    private Boolean isSpecSent = false;
    
    @Column(name = "reply_bind", nullable = false)
    private Integer replyBind = 0;
    
    @OneToMany(mappedBy = "orders", cascade = {CascadeType.PERSIST, CascadeType.MERGE, CascadeType.REMOVE}, fetch = FetchType.LAZY)
    @ToString.Exclude
    private List<Reply> replies = new ArrayList<>();
    
    // Инициализация значений по умолчанию перед сохранением
    @PrePersist
    private void init() {
        if (this.publicationTime == null) {
            this.publicationTime = OffsetDateTime.now();
        }
        if (this.replyBind == null) {
            this.replyBind = 0;
        }
        if (this.status == null) {
            this.status = OrderStatus.ACTIVE;
        }
        if (this.isDeletedByCustomer == null) {
            this.isDeletedByCustomer = false;
        }
        if (this.isSpecSent == null) {
            this.isSpecSent = false;
        }
    }
    
    public Orders(String title, String scope, String description, Customer customer, Performer performer) {
        this.title = title;
        this.scope = scope;
        this.description = description;
        this.customer = customer;
        this.performer = performer;
        this.publicationTime = OffsetDateTime.now();
        this.replyBind = 0;
        this.status = OrderStatus.ACTIVE;
        this.isDeletedByCustomer = false;
        this.isSpecSent = false;
    }
    
    // Helper methods for backward compatibility
    @Deprecated
    public boolean getIsActived() {
        return status == OrderStatus.ACTIVE;
    }
    
    @Deprecated
    public boolean getIsInProcess() {
        return status == OrderStatus.IN_PROCESS;
    }
    
    @Deprecated
    public boolean getIsOnCheck() {
        return status == OrderStatus.ON_CHECK;
    }
    
    @Deprecated
    public boolean getIsDone() {
        return status == OrderStatus.DONE;
    }
    
    @Deprecated
    public boolean getIsOnReview() {
        return status == OrderStatus.ON_REVIEW;
    }
    
    @Deprecated
    public boolean getIsRejected() {
        return status == OrderStatus.REJECTED;
    }
    
    // Методы для работы со связанными сущностями
    public void addReply(Reply reply) {
        replies.add(reply);
        reply.setOrders(this);
    }
    
    public void removeReply(Reply reply) {
        replies.remove(reply);
        reply.setOrders(null);
    }
    
    // Геттеры для обратной совместимости
    @Deprecated
    public Integer getCustomerId() {
        return customer != null ? customer.getId() : null;
    }
    
    @Deprecated
    public Integer getPerformerId() {
        return performer != null ? performer.getId() : null;
    }
    
    // Геттер для обратной совместимости со старым полем stackS
    @Deprecated
    public String getStackS() {
        return techStack;
    }
    
    @Deprecated
    public void setStackS(String stackS) {
        this.techStack = stackS;
    }

    @Override
    public final boolean equals(Object o) {
        if (this == o) return true;
        if (o == null) return false;
        Class<?> oEffectiveClass = o instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass() : o.getClass();
        Class<?> thisEffectiveClass = this instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass() : this.getClass();
        if (thisEffectiveClass != oEffectiveClass) return false;
        Orders orders = (Orders) o;
        return getId() != null && Objects.equals(getId(), orders.getId());
    }

    @Override
    public final int hashCode() {
        return this instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass().hashCode() : getClass().hashCode();
    }
}


