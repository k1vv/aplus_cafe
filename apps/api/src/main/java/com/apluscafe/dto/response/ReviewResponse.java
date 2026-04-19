package com.apluscafe.dto.response;

import com.apluscafe.entity.Review;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long orderId;
    private Long userId;
    private String userName;
    private Integer rating;
    private String comment;
    private String adminResponse;
    private LocalDateTime adminRespondedAt;
    private LocalDateTime createdAt;

    public static ReviewResponse fromEntity(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .orderId(review.getOrder().getId())
                .userId(review.getUser().getId())
                .userName(review.getUser().getFullName())
                .rating(review.getRating())
                .comment(review.getComment())
                .adminResponse(review.getAdminResponse())
                .adminRespondedAt(review.getAdminRespondedAt())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
