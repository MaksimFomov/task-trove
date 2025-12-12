package com.fomov.tasktroveapi.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.proxy.HibernateProxy;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "work_experiences", indexes = {
    @Index(name = "idx_work_experiences_customer_id", columnList = "customer_id"),
    @Index(name = "idx_work_experiences_performer_id", columnList = "performer_id"),
    @Index(name = "idx_work_experiences_created_at", columnList = "created_at"),
    @Index(name = "idx_work_experiences_order_id", columnList = "order_id"),
    @Index(name = "idx_work_experiences_reviewer_type", columnList = "reviewer_type")
})
@Getter
@Setter
@ToString
@NoArgsConstructor
public class WorkExperience {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(nullable = false, length = 255)
    private String name;
    
    @Column(nullable = false)
    private Integer rate;

    @Column(columnDefinition = "TEXT")
    private String text;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "reviewer_type", length = 20)
    private ReviewerType reviewerType;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = true,
                foreignKey = @ForeignKey(name = "fk_work_experiences_order"))
    @ToString.Exclude
    private Orders order;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_work_experiences_customer"))
    @ToString.Exclude
    private Customer customer;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performer_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_work_experiences_performer"))
    @ToString.Exclude
    private Performer performer;
    
    // Конструкторы
    public WorkExperience(String name, Integer rate, Customer customer, Performer performer) {
        this.createdAt = LocalDateTime.now();
        this.name = name;
        this.rate = rate;
        this.customer = customer;
        this.performer = performer;
    }
    
    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Override
    public final boolean equals(Object o) {
        if (this == o) return true;
        if (o == null) return false;
        Class<?> oEffectiveClass = o instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass() : o.getClass();
        Class<?> thisEffectiveClass = this instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass() : this.getClass();
        if (thisEffectiveClass != oEffectiveClass) return false;
        WorkExperience that = (WorkExperience) o;
        return getId() != null && Objects.equals(getId(), that.getId());
    }

    @Override
    public final int hashCode() {
        return this instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass().hashCode() : getClass().hashCode();
    }
}
