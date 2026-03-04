package com.cinema.repository;

import com.cinema.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:username IS NULL OR a.username LIKE %:username%) AND " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:entityName IS NULL OR a.entityName = :entityName) AND " +
           "(:userRole IS NULL OR a.userRole = :userRole) AND " +
           "(:fromDate IS NULL OR a.timestamp >= :fromDate) AND " +
           "(:toDate IS NULL OR a.timestamp <= :toDate) " +
           "ORDER BY a.timestamp DESC")
    Page<AuditLog> findWithFilters(
            @Param("username") String username,
            @Param("action") String action,
            @Param("entityName") String entityName,
            @Param("userRole") String userRole,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable);

    Page<AuditLog> findByUsernameContainingIgnoreCaseOrderByTimestampDesc(String username, Pageable pageable);

    Page<AuditLog> findByActionOrderByTimestampDesc(String action, Pageable pageable);

    Page<AuditLog> findByEntityNameOrderByTimestampDesc(String entityName, Pageable pageable);

    @Query("SELECT DISTINCT a.action FROM AuditLog a ORDER BY a.action")
    List<String> findDistinctActions();

    @Query("SELECT DISTINCT a.entityName FROM AuditLog a WHERE a.entityName IS NOT NULL ORDER BY a.entityName")
    List<String> findDistinctEntityNames();

    @Query("SELECT DISTINCT a.username FROM AuditLog a WHERE a.username IS NOT NULL ORDER BY a.username")
    List<String> findDistinctUsernames();
}
