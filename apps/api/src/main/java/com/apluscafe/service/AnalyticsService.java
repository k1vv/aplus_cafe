package com.apluscafe.service;

import com.apluscafe.dto.response.AnalyticsResponse;
import com.apluscafe.dto.response.AnalyticsResponse.*;
import com.apluscafe.entity.Order;
import com.apluscafe.entity.OrderItem;
import com.apluscafe.enums.DeliveryStatus;
import com.apluscafe.enums.OrderStatus;
import com.apluscafe.repository.DeliveryRepository;
import com.apluscafe.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final DeliveryRepository deliveryRepository;

    public AnalyticsResponse getAnalytics() {
        log.debug("Generating analytics data");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime startOfWeek = now.minusDays(7);
        LocalDateTime startOfMonth = now.minusDays(30);

        List<Order> allOrders = orderRepository.findAll();

        // Filter orders by time periods
        List<Order> todayOrders = allOrders.stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().isAfter(startOfDay))
                .toList();
        List<Order> weekOrders = allOrders.stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().isAfter(startOfWeek))
                .toList();
        List<Order> monthOrders = allOrders.stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().isAfter(startOfMonth))
                .toList();

        // Calculate overview stats
        OverviewStats overview = OverviewStats.builder()
                .todayRevenue(calculateRevenue(todayOrders))
                .weekRevenue(calculateRevenue(weekOrders))
                .monthRevenue(calculateRevenue(monthOrders))
                .todayOrders(todayOrders.size())
                .weekOrders(weekOrders.size())
                .monthOrders(monthOrders.size())
                .pendingOrders((int) allOrders.stream()
                        .filter(o -> o.getStatus() == OrderStatus.PENDING || o.getStatus() == OrderStatus.CONFIRMED)
                        .count())
                .activeDeliveries((int) deliveryRepository.findAll().stream()
                        .filter(d -> d.getStatus() == DeliveryStatus.ASSIGNED ||
                                d.getStatus() == DeliveryStatus.PICKED_UP ||
                                d.getStatus() == DeliveryStatus.IN_TRANSIT)
                        .count())
                .build();

        // Generate revenue chart (last 7 days)
        List<RevenueDataPoint> revenueChart = generateRevenueChart(allOrders, 7);

        // Get popular items
        List<PopularItem> popularItems = getPopularItems(monthOrders, 5);

        // Orders by status
        List<OrderStatusCount> ordersByStatus = getOrdersByStatus(allOrders);

        // Recent orders (last 10)
        List<RecentOrder> recentOrders = allOrders.stream()
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .limit(10)
                .map(this::mapToRecentOrder)
                .toList();

        return AnalyticsResponse.builder()
                .overview(overview)
                .revenueChart(revenueChart)
                .popularItems(popularItems)
                .ordersByStatus(ordersByStatus)
                .recentOrders(recentOrders)
                .build();
    }

    private BigDecimal calculateRevenue(List<Order> orders) {
        return orders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .map(Order::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<RevenueDataPoint> generateRevenueChart(List<Order> allOrders, int days) {
        List<RevenueDataPoint> chart = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

            List<Order> dayOrders = allOrders.stream()
                    .filter(o -> o.getCreatedAt() != null &&
                            o.getCreatedAt().isAfter(startOfDay) &&
                            o.getCreatedAt().isBefore(endOfDay) &&
                            o.getStatus() != OrderStatus.CANCELLED)
                    .toList();

            chart.add(RevenueDataPoint.builder()
                    .date(date.format(formatter))
                    .revenue(calculateRevenue(dayOrders))
                    .orders(dayOrders.size())
                    .build());
        }

        return chart;
    }

    private List<PopularItem> getPopularItems(List<Order> orders, int limit) {
        Map<Long, PopularItemAccumulator> itemStats = new HashMap<>();

        for (Order order : orders) {
            if (order.getStatus() == OrderStatus.CANCELLED || order.getOrderItems() == null) {
                continue;
            }

            for (OrderItem item : order.getOrderItems()) {
                Long menuId = item.getMenu().getId();
                PopularItemAccumulator acc = itemStats.computeIfAbsent(menuId, k ->
                        new PopularItemAccumulator(
                                menuId,
                                item.getMenu().getName(),
                                item.getMenu().getImageUrl()
                        ));
                acc.orderCount += item.getQuantity();
                acc.revenue = acc.revenue.add(item.getSubtotal());
            }
        }

        return itemStats.values().stream()
                .sorted((a, b) -> Integer.compare(b.orderCount, a.orderCount))
                .limit(limit)
                .map(acc -> PopularItem.builder()
                        .id(acc.id)
                        .name(acc.name)
                        .imageUrl(acc.imageUrl)
                        .orderCount(acc.orderCount)
                        .revenue(acc.revenue)
                        .build())
                .toList();
    }

    private List<OrderStatusCount> getOrdersByStatus(List<Order> orders) {
        Map<OrderStatus, Long> statusCounts = orders.stream()
                .filter(o -> o.getStatus() != null)
                .collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()));

        return Arrays.stream(OrderStatus.values())
                .map(status -> OrderStatusCount.builder()
                        .status(status.name().toLowerCase().replace("_", " "))
                        .count(statusCounts.getOrDefault(status, 0L).intValue())
                        .build())
                .toList();
    }

    private RecentOrder mapToRecentOrder(Order order) {
        return RecentOrder.builder()
                .id(order.getId())
                .customerName(order.getUser() != null ? order.getUser().getFullName() : "Unknown")
                .total(order.getTotalAmount())
                .status(order.getStatus().name().toLowerCase().replace("_", " "))
                .orderType(order.getOrderType() != null ? order.getOrderType().name().toLowerCase().replace("_", " ") : "")
                .createdAt(order.getCreatedAt() != null ?
                        order.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "")
                .itemCount(order.getOrderItems() != null ?
                        order.getOrderItems().stream().mapToInt(OrderItem::getQuantity).sum() : 0)
                .build();
    }

    private static class PopularItemAccumulator {
        Long id;
        String name;
        String imageUrl;
        int orderCount = 0;
        BigDecimal revenue = BigDecimal.ZERO;

        PopularItemAccumulator(Long id, String name, String imageUrl) {
            this.id = id;
            this.name = name;
            this.imageUrl = imageUrl;
        }
    }
}
