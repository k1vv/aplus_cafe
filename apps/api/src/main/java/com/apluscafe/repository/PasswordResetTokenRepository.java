package com.apluscafe.repository;

import com.apluscafe.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenAndIsUsedFalse(String token);

    @Modifying
    @Query("UPDATE PasswordResetToken p SET p.isUsed = true WHERE p.user.id = :userId")
    void invalidateAllUserTokens(Long userId);
}
