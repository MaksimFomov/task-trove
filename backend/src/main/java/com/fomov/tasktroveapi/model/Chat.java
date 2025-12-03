package com.fomov.tasktroveapi.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.proxy.HibernateProxy;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "chats", indexes = {
    @Index(name = "idx_chats_customer_id", columnList = "customer_id"),
    @Index(name = "idx_chats_performer_id", columnList = "performer_id"),
    @Index(name = "idx_chats_administrator_id", columnList = "administrator_id"),
    @Index(name = "idx_chats_last_message_time", columnList = "last_message_time")
})
@Getter
@Setter
@ToString
@NoArgsConstructor
public class Chat {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_chats_customer"))
    @ToString.Exclude
    private Customer customer;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performer_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_chats_performer"))
    @ToString.Exclude
    private Performer performer;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "administrator_id", nullable = true,
                foreignKey = @ForeignKey(name = "fk_chats_administrator"))
    @ToString.Exclude
    private Administrator administrator;
    
    @Column(name = "room_name", nullable = false, length = 100)
    private String roomName;
    
    @Column(name = "last_message_time")
    private LocalDateTime lastMessageTime;
    
    @Column(name = "check_by_customer", nullable = false)
    private Boolean checkByCustomer = false;
    
    @Column(name = "check_by_performer", nullable = false)
    private Boolean checkByPerformer = false;
    
    @Column(name = "check_by_administrator", nullable = false)
    private Boolean checkByAdministrator = false;
    
    @Column(name = "last_checked_by_customer_time")
    private OffsetDateTime lastCheckedByCustomerTime;
    
    @Column(name = "last_checked_by_performer_time")
    private OffsetDateTime lastCheckedByPerformerTime;
    
    @Column(name = "deleted_by_customer", nullable = false)
    private Boolean deletedByCustomer = false;
    
    @Column(name = "deleted_by_performer", nullable = false)
    private Boolean deletedByPerformer = false;
    
    // Геттеры для обратной совместимости
    public Integer getCustomerId() {
        return customer != null ? customer.getId() : null;
    }
    
    public Integer getPerformerId() {
        return performer != null ? performer.getId() : null;
    }
    
    public Integer getAdministratorId() {
        return administrator != null ? administrator.getId() : null;
    }
    
    @OneToMany(mappedBy = "chat", cascade = {CascadeType.PERSIST, CascadeType.MERGE, CascadeType.REMOVE}, fetch = FetchType.LAZY)
    @ToString.Exclude
    private List<Message> messages = new ArrayList<>();
    
    // Методы для работы со связанными сущностями
    public void addMessage(Message message) {
        messages.add(message);
        message.setChat(this);
        OffsetDateTime created = message.getCreated();
        if (created != null) {
            this.lastMessageTime = created.atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
        }
    }
    
    public void removeMessage(Message message) {
        messages.remove(message);
        message.setChat(null);
    }

    @Override
    public final boolean equals(Object o) {
        if (this == o) return true;
        if (o == null) return false;
        Class<?> oEffectiveClass = o instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass() : o.getClass();
        Class<?> thisEffectiveClass = this instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass() : this.getClass();
        if (thisEffectiveClass != oEffectiveClass) return false;
        Chat chat = (Chat) o;
        return getId() != null && Objects.equals(getId(), chat.getId());
    }

    @Override
    public final int hashCode() {
        return this instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass().hashCode() : getClass().hashCode();
    }
}


