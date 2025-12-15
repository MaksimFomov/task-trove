package com.fomov.tasktroveapi.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.proxy.HibernateProxy;

import java.util.Objects;

@Entity
@Table(name = "portfolios", indexes = {
    @Index(name = "idx_portfolios_performer_id", columnList = "performer_id"),
    @Index(name = "idx_portfolios_customer_id", columnList = "customer_id"),
    @Index(name = "idx_portfolios_is_active", columnList = "is_active"),
    @Index(name = "idx_portfolios_owner_type", columnList = "owner_type")
})
@Getter
@Setter
@ToString
@NoArgsConstructor
public class Portfolio {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performer_id", nullable = true,
                foreignKey = @ForeignKey(name = "fk_portfolios_performer"))
    @ToString.Exclude
    @JsonIgnore
    private Performer performer;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = true,
                foreignKey = @ForeignKey(name = "fk_portfolios_customer"))
    @ToString.Exclude
    @JsonIgnore
    private Customer customer;
    
    @Column(name = "owner_type", nullable = false, length = 20)
    private String ownerType; // "PERFORMER" or "CUSTOMER"
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(length = 50)
    private String phone;
    
    @Column(length = 255)
    private String email;
    
    @Column(name = "town_country", length = 255)
    private String townCountry;
    
    @Column(columnDefinition = "TEXT")
    private String specializations;
    
    @Column(columnDefinition = "TEXT")
    private String employment;
    
    @Column(columnDefinition = "TEXT")
    private String experience;
    
    @Column(columnDefinition = "TEXT")
    private String description; // Для заказчиков
    
    @Column(name = "scope_s", length = 255)
    private String scopeS; // Для заказчиков
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;
    
    // Геттеры для обратной совместимости
    public Integer getPerformerId() {
        return performer != null ? performer.getId() : null;
    }
    
    public Integer getCustomerId() {
        return customer != null ? customer.getId() : null;
    }
    
    // Конструкторы
    public Portfolio(Performer performer, String name) {
        this.performer = performer;
        this.customer = null;
        this.ownerType = "PERFORMER";
        this.name = name;
    }
    
    public Portfolio(Customer customer, String name) {
        this.customer = customer;
        this.performer = null;
        this.ownerType = "CUSTOMER";
        this.name = name;
    }

    @Override
    public final boolean equals(Object o) {
        if (this == o) return true;
        if (o == null) return false;
        Class<?> oEffectiveClass = o instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass() : o.getClass();
        Class<?> thisEffectiveClass = this instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass() : this.getClass();
        if (thisEffectiveClass != oEffectiveClass) return false;
        Portfolio portfolio = (Portfolio) o;
        return getId() != null && Objects.equals(getId(), portfolio.getId());
    }

    @Override
    public final int hashCode() {
        return this instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass().hashCode() : getClass().hashCode();
    }
}


