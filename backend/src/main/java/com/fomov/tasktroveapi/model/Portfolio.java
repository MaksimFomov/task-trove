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
    @Index(name = "idx_portfolios_is_active", columnList = "is_active")
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
    @JoinColumn(name = "performer_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_portfolios_performer"))
    @ToString.Exclude
    @JsonIgnore
    private Performer performer;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(length = 20)
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
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;
    
    // Геттер для обратной совместимости
    public Integer getPerformerId() {
        return performer != null ? performer.getId() : null;
    }
    
    // Конструкторы
    public Portfolio(Performer performer, String name) {
        this.performer = performer;
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


