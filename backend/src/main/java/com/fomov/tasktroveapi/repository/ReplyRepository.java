package com.fomov.tasktroveapi.repository;

import com.fomov.tasktroveapi.model.Reply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReplyRepository extends JpaRepository<Reply, Integer> {
    // Используем методы с вложенными полями для работы с объектами
    List<Reply> findByOrders_Id(Integer orderId);
    List<Reply> findByPerformer_Id(Integer performerId);
    boolean existsByOrders_IdAndPerformer_Id(Integer orderId, Integer performerId);
    
    @Query("SELECT r FROM Reply r LEFT JOIN FETCH r.orders LEFT JOIN FETCH r.performer WHERE r.performer.id = :performerId")
    List<Reply> findByPerformerIdWithRelations(@Param("performerId") Integer performerId);
    
    @Query("SELECT r FROM Reply r LEFT JOIN FETCH r.orders LEFT JOIN FETCH r.performer WHERE r.orders.id = :orderId")
    List<Reply> findByOrderIdWithRelations(@Param("orderId") Integer orderId);
    
    // Используем native query для гарантированного обновления
    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @org.springframework.transaction.annotation.Transactional
    @Query(value = "UPDATE replies SET is_on_customer = 1 WHERE order_id = :orderId AND performer_id = :performerId", nativeQuery = true)
    int updateIsOnCustomerByOrderIdAndPerformerId(@Param("orderId") Integer orderId, @Param("performerId") Integer performerId);
    
    // Удаление отклика по orderId и performerId через native query
    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @org.springframework.transaction.annotation.Transactional
    @Query(value = "DELETE FROM replies WHERE order_id = :orderId AND performer_id = :performerId", nativeQuery = true)
    int deleteByOrderIdAndPerformerId(@Param("orderId") Integer orderId, @Param("performerId") Integer performerId);
}


