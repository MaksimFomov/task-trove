package com.fomov.tasktroveapi.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.proxy.HibernateProxy;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "customers", indexes = {
    @Index(name = "idx_customers_account_id", columnList = "account_id")
})
@Getter
@Setter
@ToString
@NoArgsConstructor
public class Customer {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false, unique = true,
                foreignKey = @ForeignKey(name = "fk_customers_account"))
    @ToString.Exclude
    @JsonIgnore
    private Account account;
    
    
    @Column(name = "last_name", length = 50)
    private String lastName;
    
    @Column(name = "first_name", length = 50)
    private String firstName;
    
    @Column(name = "middle_name", length = 50)
    private String middleName;
    
    @Column(length = 50)
    private String phone;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "scope_s", length = 255)
    private String scopeS;
    
    @OneToMany(mappedBy = "customer", cascade = {CascadeType.PERSIST, CascadeType.MERGE, CascadeType.REMOVE}, fetch = FetchType.LAZY)
    @ToString.Exclude
    @JsonIgnore
    private List<Chat> chats = new ArrayList<>();
    
    @OneToMany(mappedBy = "customer", cascade = {CascadeType.PERSIST, CascadeType.MERGE, CascadeType.REMOVE}, fetch = FetchType.LAZY)
    @ToString.Exclude
    @JsonIgnore
    private List<Orders> orders = new ArrayList<>();
    
    @OneToMany(mappedBy = "customer", cascade = {CascadeType.PERSIST, CascadeType.MERGE, CascadeType.REMOVE}, fetch = FetchType.LAZY)
    @ToString.Exclude
    @JsonIgnore
    private List<WorkExperience> workExperiences = new ArrayList<>();
    
    // Методы для работы со связанными сущностями
    public void addChat(Chat chat) {
        chats.add(chat);
        chat.setCustomer(this);
    }
    
    public void removeChat(Chat chat) {
        chats.remove(chat);
        chat.setCustomer(null);
    }
    
    public void addOrder(Orders order) {
        orders.add(order);
        order.setCustomer(this);
    }
    
    public void removeOrder(Orders order) {
        orders.remove(order);
        order.setCustomer(null);
    }
    
    public void addWorkExperience(WorkExperience workExperience) {
        workExperiences.add(workExperience);
        workExperience.setCustomer(this);
    }
    
    public void removeWorkExperience(WorkExperience workExperience) {
        workExperiences.remove(workExperience);
        workExperience.setCustomer(null);
    }

    /**
     * Получает email из связанного Account
     * @return email или null если account не установлен
     */
    public String getEmail() {
        return account != null ? account.getEmail() : null;
    }
    
    /**
     * Получает полное имя в формате ФИО
     * @return полное имя или null если не заполнено
     */
    public String getFullName() {
        StringBuilder fullName = new StringBuilder();
        if (lastName != null && !lastName.trim().isEmpty()) {
            fullName.append(lastName.trim());
        }
        if (firstName != null && !firstName.trim().isEmpty()) {
            if (fullName.length() > 0) fullName.append(" ");
            fullName.append(firstName.trim());
        }
        if (middleName != null && !middleName.trim().isEmpty()) {
            if (fullName.length() > 0) fullName.append(" ");
            fullName.append(middleName.trim());
        }
        return fullName.length() > 0 ? fullName.toString() : null;
    }

    @Override
    public final boolean equals(Object o) {
        if (this == o) return true;
        if (o == null) return false;
        Class<?> oEffectiveClass = o instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass() : o.getClass();
        Class<?> thisEffectiveClass = this instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass() : this.getClass();
        if (thisEffectiveClass != oEffectiveClass) return false;
        Customer customer = (Customer) o;
        return getId() != null && Objects.equals(getId(), customer.getId());
    }

    @Override
    public final int hashCode() {
        return this instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass().hashCode() : getClass().hashCode();
    }
}


