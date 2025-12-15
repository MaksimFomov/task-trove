package com.fomov.tasktroveapi.repository;

import com.fomov.tasktroveapi.model.OrderStatus;
import com.fomov.tasktroveapi.model.Orders;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrdersRepository extends JpaRepository<Orders, Integer> {
    @Query("SELECT DISTINCT o FROM Orders o LEFT JOIN FETCH o.customer LEFT JOIN FETCH o.performer LEFT JOIN FETCH o.replies WHERE LOWER(o.title) LIKE LOWER(CONCAT('%', :title, '%'))")
    List<Orders> findByTitleContainingIgnoreCase(@Param("title") String title);
    
    @Query("SELECT DISTINCT o FROM Orders o LEFT JOIN FETCH o.customer LEFT JOIN FETCH o.performer LEFT JOIN FETCH o.replies WHERE LOWER(o.title) LIKE LOWER(CONCAT('%', :title, '%')) AND o.status = 'ACTIVE' AND o.performer IS NULL")
    List<Orders> findByTitleContainingIgnoreCaseAndActive(@Param("title") String title);
    
    @Query("SELECT DISTINCT o FROM Orders o LEFT JOIN FETCH o.customer LEFT JOIN FETCH o.performer LEFT JOIN FETCH o.replies WHERE o.status = :status AND o.performer IS NULL")
    List<Orders> findByStatusAndPerformerIsNull(@Param("status") OrderStatus status);
    
    @Query("SELECT DISTINCT o FROM Orders o LEFT JOIN FETCH o.customer LEFT JOIN FETCH o.performer LEFT JOIN FETCH o.replies WHERE o.status = 'ACTIVE' AND o.performer IS NULL")
    List<Orders> findAllActive();
    
    @Query("SELECT DISTINCT o FROM Orders o LEFT JOIN FETCH o.customer c LEFT JOIN FETCH c.account LEFT JOIN FETCH o.performer p LEFT JOIN FETCH p.account LEFT JOIN FETCH o.replies WHERE o.customer.id = :customerId")
    List<Orders> findByCustomerId(@Param("customerId") Integer customerId);
    
    @Query("SELECT o FROM Orders o LEFT JOIN FETCH o.customer c LEFT JOIN FETCH c.account LEFT JOIN FETCH o.performer p LEFT JOIN FETCH p.account WHERE o.performer.id = :performerId")
    List<Orders> findByPerformerId(@Param("performerId") Integer performerId);
    
    @Query("SELECT DISTINCT o FROM Orders o LEFT JOIN FETCH o.customer LEFT JOIN FETCH o.performer WHERE o.status = :status")
    List<Orders> findByStatus(@Param("status") OrderStatus status);
    
    @Query("SELECT DISTINCT o FROM Orders o LEFT JOIN FETCH o.customer c LEFT JOIN FETCH c.account LEFT JOIN FETCH o.performer p LEFT JOIN FETCH p.account LEFT JOIN FETCH o.replies")
    List<Orders> findAll();
    
    @Query("SELECT o FROM Orders o LEFT JOIN FETCH o.customer LEFT JOIN FETCH o.performer LEFT JOIN FETCH o.replies WHERE o.id = :id")
    java.util.Optional<Orders> findById(@Param("id") Integer id);
}


