package com.fomov.tasktroveapi.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.proxy.HibernateProxy;

import java.time.OffsetDateTime;
import java.util.Objects;

@Entity
@Table(name = "messages", indexes = {
    @Index(name = "idx_messages_chat_id", columnList = "chat_id"),
    @Index(name = "idx_messages_created", columnList = "created"),
    @Index(name = "idx_messages_sender_id", columnList = "sender_id")
})
@Getter
@Setter
@ToString
@NoArgsConstructor
public class Message {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_messages_chat"))
    @ToString.Exclude
    private Chat chat;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_messages_sender"))
    @ToString.Exclude
    private Account sender;
    
    @Column(name = "sender_type", nullable = false, length = 20)
    private String senderType; // "Customer", "Performer", "Administrator"
    
    @Column(name = "created", nullable = false)
    private OffsetDateTime created;
    
    // Геттер для обратной совместимости
    public Integer getChatId() {
        return chat != null ? chat.getId() : null;
    }
    
    // Геттер для обратной совместимости
    public String getFromWho() {
        return senderType;
    }
    
    // Геттер для обратной совместимости
    @Deprecated
    public Integer getSenderId() {
        return sender != null ? sender.getId() : null;
    }
    
    @Deprecated
    public void setSenderId(Integer senderId) {
        // This method is kept for backward compatibility but should not be used
        // Use setSender() instead
    }
    
    // Конструкторы
    public Message(String text, Chat chat, Account sender, String senderType) {
        this.created = OffsetDateTime.now();
        this.text = text;
        this.chat = chat;
        this.sender = sender;
        this.senderType = senderType;
    }
    
    @Deprecated
    public Message(String text, Chat chat, Integer senderId, String senderType) {
        this.created = OffsetDateTime.now();
        this.text = text;
        this.chat = chat;
        this.senderType = senderType;
        // Note: sender should be set separately using setSender()
    }

    @Override
    public final boolean equals(Object o) {
        if (this == o) return true;
        if (o == null) return false;
        Class<?> oEffectiveClass = o instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass() : o.getClass();
        Class<?> thisEffectiveClass = this instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass() : this.getClass();
        if (thisEffectiveClass != oEffectiveClass) return false;
        Message message = (Message) o;
        return getId() != null && Objects.equals(getId(), message.getId());
    }

    @Override
    public final int hashCode() {
        return this instanceof HibernateProxy proxy ? proxy.getHibernateLazyInitializer().getPersistentClass().hashCode() : getClass().hashCode();
    }
}


