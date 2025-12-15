package com.fomov.tasktroveapi.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.proxy.HibernateProxy;

import java.util.Objects;

@Entity
@Table(name = "replies", indexes = {
    @Index(name = "idx_replies_order_id", columnList = "order_id"),
    @Index(name = "idx_replies_performer_id", columnList = "performer_id")
})
@Getter
@Setter
@ToString
@NoArgsConstructor
public class Reply {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_replies_order"))
    @ToString.Exclude
    private Orders orders;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performer_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_replies_performer"))
    @ToString.Exclude
    private Performer performer;
    
    @Column(name = "is_approved_by_customer", nullable = false)
    private Boolean isApprovedByCustomer = false;
    
    // Геттеры для обратной совместимости
    public String getOrderName() {
        return orders != null ? orders.getTitle() : null;
    }
    
    public Integer getOrderId() {
        return orders != null ? orders.getId() : null;
    }
    
    public Integer getPerformerId() {
        return performer != null ? performer.getId() : null;
    }
    
    // Конструкторы
    public Reply(Orders orders, Performer performer) {
        this.orders = orders;
        this.performer = performer;
    }

    @Override
    public final boolean equals(Object o) {
        if (this == o) return true;
        if (o == null) return false;
        Class<?> oEffectiveClass = o instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass() : o.getClass();
        Class<?> thisEffectiveClass = this instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass() : this.getClass();
        if (thisEffectiveClass != oEffectiveClass) return false;
        Reply reply = (Reply) o;
        return getId() != null && Objects.equals(getId(), reply.getId());
    }

    @Override
    public final int hashCode() {
        return this instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass().hashCode() : getClass().hashCode();
    }
}


