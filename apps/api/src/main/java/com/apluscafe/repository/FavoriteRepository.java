package com.apluscafe.repository;

import com.apluscafe.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Favorite> findByUserIdAndMenuId(Long userId, Long menuId);

    boolean existsByUserIdAndMenuId(Long userId, Long menuId);

    void deleteByUserIdAndMenuId(Long userId, Long menuId);

    @Query("SELECT f.menu.id FROM Favorite f WHERE f.user.id = :userId")
    List<Long> findMenuIdsByUserId(Long userId);
}
