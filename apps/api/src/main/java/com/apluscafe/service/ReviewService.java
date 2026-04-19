package com.apluscafe.service;

import com.apluscafe.dto.request.CreateReviewRequest;
import com.apluscafe.dto.response.ReviewResponse;
import com.apluscafe.dto.response.ReviewStatsResponse;
import com.apluscafe.entity.Order;
import com.apluscafe.entity.Review;
import com.apluscafe.entity.User;
import com.apluscafe.enums.OrderStatus;
import com.apluscafe.repository.OrderRepository;
import com.apluscafe.repository.ReviewRepository;
import com.apluscafe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public List<ReviewResponse> getUserReviews(Long userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(ReviewResponse::fromEntity)
                .toList();
    }

    public ReviewResponse getReviewByOrder(Long orderId) {
        return reviewRepository.findByOrderId(orderId)
                .map(ReviewResponse::fromEntity)
                .orElse(null);
    }

    public boolean canReviewOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) return false;

        // Must be owner
        if (!order.getUser().getId().equals(userId)) return false;

        // Must be delivered
        if (order.getStatus() != OrderStatus.DELIVERED) return false;

        // Must not already have a review
        return !reviewRepository.existsByOrderId(orderId);
    }

    @Transactional
    public ReviewResponse createReview(Long userId, CreateReviewRequest request) {
        log.info("Creating review for order: {} by user: {}", request.getOrderId(), userId);

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Verify ownership
        if (!order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Cannot review this order");
        }

        // Verify order is delivered
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new RuntimeException("Can only review delivered orders");
        }

        // Check if already reviewed
        if (reviewRepository.existsByOrderId(request.getOrderId())) {
            throw new RuntimeException("Order already reviewed");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Review review = Review.builder()
                .user(user)
                .order(order)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        review = reviewRepository.save(review);
        log.info("Review created: {} for order: {}", review.getId(), request.getOrderId());

        return ReviewResponse.fromEntity(review);
    }

    // Admin methods
    public List<ReviewResponse> getAllReviews() {
        return reviewRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(ReviewResponse::fromEntity)
                .toList();
    }

    public ReviewStatsResponse getReviewStats() {
        Double avgRating = reviewRepository.getAverageRating();
        long totalReviews = reviewRepository.count();

        return ReviewStatsResponse.builder()
                .averageRating(avgRating != null ? avgRating : 0.0)
                .totalReviews(totalReviews)
                .fiveStarCount(reviewRepository.countByRating(5))
                .fourStarCount(reviewRepository.countByRating(4))
                .threeStarCount(reviewRepository.countByRating(3))
                .twoStarCount(reviewRepository.countByRating(2))
                .oneStarCount(reviewRepository.countByRating(1))
                .build();
    }

    @Transactional
    public ReviewResponse respondToReview(Long reviewId, String response) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        review.setAdminResponse(response);
        review.setAdminRespondedAt(LocalDateTime.now());
        review = reviewRepository.save(review);

        log.info("Admin responded to review: {}", reviewId);
        return ReviewResponse.fromEntity(review);
    }
}
