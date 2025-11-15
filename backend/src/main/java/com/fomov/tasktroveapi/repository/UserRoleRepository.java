package com.fomov.tasktroveapi.repository;

import com.fomov.tasktroveapi.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Integer> {
    
    // Используем методы с вложенными полями для работы с объектами
    List<UserRole> findByUser_Id(Integer userId);
    List<UserRole> findByRole_Id(Integer roleId);
    Optional<UserRole> findByUser_IdAndRole_Id(Integer userId, Integer roleId);
    boolean existsByUser_IdAndRole_Id(Integer userId, Integer roleId);
    
    @Query("SELECT ur FROM UserRole ur WHERE ur.user.id = :userId AND ur.isActive = true")
    List<UserRole> findActiveRolesByUserId(@Param("userId") Integer userId);
    
    @Query("SELECT ur FROM UserRole ur WHERE ur.role.id = :roleId AND ur.isActive = true")
    List<UserRole> findActiveUsersByRoleId(@Param("roleId") Integer roleId);
}
