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
    @Index(name = "idx_orders_status", columnList = "is_actived,is_in_process,is_on_check,is_done,is_on_review,is_rejected"),
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
    
    @Column(name = "is_actived", nullable = false)
    private Boolean isActived = true;
    
    @Column(name = "is_in_process", nullable = false)
    private Boolean isInProcess = false;
    
    @Column(name = "is_on_check", nullable = false)
    private Boolean isOnCheck = false;
    
    @Column(name = "is_done", nullable = false)
    private Boolean isDone = false;
    
    @Column(name = "is_on_review", nullable = false)
    private Boolean isOnReview = false;
    
    @Column(name = "is_rejected", nullable = false)
    private Boolean isRejected = false;
    
    @Column(name = "is_deleted_by_customer", nullable = false)
    private Boolean isDeletedByCustomer = false;
    
    @Column(name = "publication_time", nullable = false)
    private OffsetDateTime publicationTime;
    
    @Column(name = "start_time")
    private OffsetDateTime startTime;
    
    @Column(name = "end_time")
    private OffsetDateTime endTime;
    
    @Column(name = "document_name", length = 255)
    private String documentName;
    
    @Column(name = "result_link", length = 500)
    private String resultLink;
    
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
        if (this.isActived == null) {
            this.isActived = true;
        }
        if (this.isInProcess == null) {
            this.isInProcess = false;
        }
        if (this.isOnCheck == null) {
            this.isOnCheck = false;
        }
        if (this.isDone == null) {
            this.isDone = false;
        }
        if (this.isOnReview == null) {
            this.isOnReview = false;
        }
        if (this.isDeletedByCustomer == null) {
            this.isDeletedByCustomer = false;
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
        this.isActived = true;
        this.isInProcess = false;
        this.isOnCheck = false;
        this.isDone = false;
        this.isOnReview = false;
        this.isRejected = false;
        this.isDeletedByCustomer = false;
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


