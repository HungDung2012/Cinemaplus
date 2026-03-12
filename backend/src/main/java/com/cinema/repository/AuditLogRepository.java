package com.cinema.repository;

import com.cinema.audit.AuditAction;
import com.cinema.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT DISTINCT a.action FROM AuditLog a ORDER BY a.action")
    List<AuditAction> findDistinctActions();

    @Query("SELECT DISTINCT a.entityName FROM AuditLog a WHERE a.entityName IS NOT NULL ORDER BY a.entityName")
    List<String> findDistinctEntityNames();

    @Query("SELECT DISTINCT a.username FROM AuditLog a WHERE a.username IS NOT NULL ORDER BY a.username")
    List<String> findDistinctUsernames();

    @Query("SELECT DISTINCT a.userRole FROM AuditLog a WHERE a.userRole IS NOT NULL ORDER BY a.userRole")
    List<String> findDistinctUserRoles();
}
