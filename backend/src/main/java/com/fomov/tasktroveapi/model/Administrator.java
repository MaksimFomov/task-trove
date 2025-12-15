package com.fomov.tasktroveapi.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.proxy.HibernateProxy;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "administrators", indexes = {
    @Index(name = "idx_administrators_account_id", columnList = "account_id")
})
@Getter
@Setter
@ToString
@NoArgsConstructor
public class Administrator {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false, unique = true,
                foreignKey = @ForeignKey(name = "fk_administrators_account"))
    @ToString.Exclude
    private Account account;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    // Email теперь берется из связанного Account
    public String getEmail() {
        return account != null ? account.getEmail() : null;
    }
    
    @Deprecated
    public void setEmail(String email) {
        // Email хранится в Account, этот метод оставлен для обратной совместимости
        // Use account.setEmail() instead
    }

    @Override
    public final boolean equals(Object o) {
        if (this == o) return true;
        if (o == null) return false;
        Class<?> oEffectiveClass = o instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass() : o.getClass();
        Class<?> thisEffectiveClass = this instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass() : this.getClass();
        if (thisEffectiveClass != oEffectiveClass) return false;
        Administrator that = (Administrator) o;
        return getId() != null && Objects.equals(getId(), that.getId());
    }

    @Override
    public final int hashCode() {
        return this instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass().hashCode() : getClass().hashCode();
    }
}
