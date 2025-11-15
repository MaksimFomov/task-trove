package com.fomov.tasktroveapi.repository;

import com.fomov.tasktroveapi.model.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Integer> {
    
    @Query("SELECT c FROM Chat c " +
           "LEFT JOIN FETCH c.customer cust " +
           "LEFT JOIN FETCH cust.account " +
           "LEFT JOIN FETCH c.performer perf " +
           "LEFT JOIN FETCH perf.account " +
           "LEFT JOIN FETCH c.administrator " +
           "WHERE c.roomName = :roomName")
    List<Chat> findByRoomNameWithRelations(@Param("roomName") String roomName);
    
    @Query("SELECT c FROM Chat c " +
           "LEFT JOIN FETCH c.customer cust " +
           "LEFT JOIN FETCH cust.account " +
           "LEFT JOIN FETCH c.performer perf " +
           "LEFT JOIN FETCH perf.account " +
           "LEFT JOIN FETCH c.administrator " +
           "WHERE c.customer.id = :customerId")
    List<Chat> findByCustomerIdWithRelations(@Param("customerId") Integer customerId);
    
    @Query("SELECT c FROM Chat c " +
           "LEFT JOIN FETCH c.customer cust " +
           "LEFT JOIN FETCH cust.account " +
           "LEFT JOIN FETCH c.performer perf " +
           "LEFT JOIN FETCH perf.account " +
           "LEFT JOIN FETCH c.administrator " +
           "WHERE c.performer.id = :performerId")
    List<Chat> findByPerformerIdWithRelations(@Param("performerId") Integer performerId);
    
    @Query("SELECT c FROM Chat c " +
           "LEFT JOIN FETCH c.customer cust " +
           "LEFT JOIN FETCH cust.account " +
           "LEFT JOIN FETCH c.performer perf " +
           "LEFT JOIN FETCH perf.account " +
           "LEFT JOIN FETCH c.administrator " +
           "WHERE c.id = :id")
    Optional<Chat> findByIdWithRelations(@Param("id") Integer id);
    
    @Query("SELECT c FROM Chat c " +
           "LEFT JOIN FETCH c.customer cust " +
           "LEFT JOIN FETCH cust.account " +
           "LEFT JOIN FETCH c.performer perf " +
           "LEFT JOIN FETCH perf.account " +
           "LEFT JOIN FETCH c.administrator")
    List<Chat> findAllWithRelations();
    
    // Deprecated: Use findByRoomNameWithRelations instead
    @Deprecated
    List<Chat> findByRoomName(String roomName);
    
    // Deprecated: Use findByCustomerIdWithRelations instead
    @Deprecated
    List<Chat> findByCustomer_Id(Integer customerId);
    
    // Deprecated: Use findByPerformerIdWithRelations instead
    @Deprecated
    List<Chat> findByPerformer_Id(Integer performerId);
}


