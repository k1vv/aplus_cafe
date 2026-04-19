package com.apluscafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {

    private OverviewStats overview;
    private List<RevenueDataPoint> revenueChart;
    private List<PopularItem> popularItems;
    private List<OrderStatusCount> ordersByStatus;
    private List<RecentOrder> recentOrders;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverviewStats {
        private BigDecimal todayRevenue;
        private BigDecimal weekRevenue;
        private BigDecimal monthRevenue;
        private int todayOrders;
        private int weekOrders;
        private int monthOrders;
        private int pendingOrders;
        private int activeDeliveries;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueDataPoint {
        private String date;
        private BigDecimal revenue;
        private int orders;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PopularItem {
        private Long id;
        private String name;
        private String imageUrl;
        private int orderCount;
        private BigDecimal revenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderStatusCount {
        private String status;
        private int count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentOrder {
        private Long id;
        private String customerName;
        private BigDecimal total;
        private String status;
        private String orderType;
        private String createdAt;
        private int itemCount;
    }
}
