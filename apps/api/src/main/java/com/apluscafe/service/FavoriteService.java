package com.apluscafe.service;

import com.apluscafe.dto.response.MenuResponse;
import com.apluscafe.entity.Favorite;
import com.apluscafe.entity.Menu;
import com.apluscafe.entity.User;
import com.apluscafe.repository.FavoriteRepository;
import com.apluscafe.repository.MenuRepository;
import com.apluscafe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final MenuRepository menuRepository;

    public List<MenuResponse> getUserFavorites(Long userId) {
        log.debug("Fetching favorites for user: {}", userId);
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(fav -> MenuResponse.fromEntity(fav.getMenu()))
                .toList();
    }

    public Set<Long> getUserFavoriteIds(Long userId) {
        return favoriteRepository.findMenuIdsByUserId(userId).stream()
                .collect(Collectors.toSet());
    }

    @Transactional
    public boolean toggleFavorite(Long userId, Long menuId) {
        log.info("Toggling favorite for user: {}, menu: {}", userId, menuId);

        if (favoriteRepository.existsByUserIdAndMenuId(userId, menuId)) {
            favoriteRepository.deleteByUserIdAndMenuId(userId, menuId);
            log.info("Removed favorite for user: {}, menu: {}", userId, menuId);
            return false;
        } else {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Menu menu = menuRepository.findById(menuId)
                    .orElseThrow(() -> new RuntimeException("Menu item not found"));

            Favorite favorite = Favorite.builder()
                    .user(user)
                    .menu(menu)
                    .build();

            favoriteRepository.save(favorite);
            log.info("Added favorite for user: {}, menu: {}", userId, menuId);
            return true;
        }
    }

    public boolean isFavorite(Long userId, Long menuId) {
        return favoriteRepository.existsByUserIdAndMenuId(userId, menuId);
    }
}
