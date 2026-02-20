package com.cinema.repository;

import com.cinema.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    Boolean existsByEmailAndIdNot(String email, Long id);

    Optional<User> findByEmailAndActiveTrue(String email);

    Optional<User> findById(Long id);

    // ==================== ANALYTICS ====================

    @Query("SELECT new map(FUNCTION('DATE', u.createdAt) as date, COUNT(u) as newUsers) " +
           "FROM User u " +
           "WHERE u.createdAt >= :startDate " +
           "AND (:endDate IS NULL OR u.createdAt <= :endDate) " +
           "GROUP BY FUNCTION('DATE', u.createdAt) " +
           "ORDER BY date ASC")
    List<java.util.Map<String, Object>> getNewUsersOverTime(
           @Param("startDate") LocalDateTime startDate,
           @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(u) FROM User u " +
           "WHERE u.createdAt >= :startDate " +
           "AND (:endDate IS NULL OR u.createdAt <= :endDate)")
    Long countNewUsersInPeriod(
           @Param("startDate") LocalDateTime startDate,
           @Param("endDate") LocalDateTime endDate);
}
