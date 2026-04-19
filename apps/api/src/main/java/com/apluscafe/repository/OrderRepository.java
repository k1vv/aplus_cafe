package com.apluscafe.repository;

import com.apluscafe.entity.Order;
import com.apluscafe.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserId(Long userId);

    // Fetch order items eagerly to avoid LazyInitializationException
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.orderItems oi LEFT JOIN FETCH oi.menu LEFT JOIN FETCH o.delivery LEFT JOIN FETCH o.user WHERE o.user.id = :userId ORDER BY o.createdAt DESC")
    List<Order> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    // Fetch order by ID with items
    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.orderItems oi LEFT JOIN FETCH oi.menu LEFT JOIN FETCH o.delivery LEFT JOIN FETCH o.user WHERE o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") Long id);

    List<Order> findByStatus(OrderStatus status);

    List<Order> findByStatusIn(List<OrderStatus> statuses);

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.orderItems oi LEFT JOIN FETCH oi.menu LEFT JOIN FETCH o.delivery LEFT JOIN FETCH o.user WHERE o.status NOT IN ('DELIVERED', 'CANCELLED') ORDER BY o.createdAt ASC")
    List<Order> findActiveOrders();

    List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
