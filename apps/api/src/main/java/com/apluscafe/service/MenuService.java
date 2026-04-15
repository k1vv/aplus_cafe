package com.apluscafe.service;

import com.apluscafe.dto.response.MenuResponse;
import com.apluscafe.entity.Category;
import com.apluscafe.entity.Menu;
import com.apluscafe.repository.CategoryRepository;
import com.apluscafe.repository.MenuRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuRepository menuRepository;
    private final CategoryRepository categoryRepository;

    public List<MenuResponse> getAllMenuItems() {
        log.debug("Fetching all menu items");
        List<MenuResponse> items = menuRepository.findAll().stream()
                .map(MenuResponse::fromEntity)
                .collect(Collectors.toList());
        log.debug("Found {} total menu items", items.size());
        return items;
    }

    public List<MenuResponse> getAvailableMenuItems() {
        log.debug("Fetching available menu items");
        List<MenuResponse> items = menuRepository.findByIsAvailableTrue().stream()
                .map(MenuResponse::fromEntity)
                .collect(Collectors.toList());
        log.debug("Found {} available menu items", items.size());
        return items;
    }

    public List<MenuResponse> getMenuItemsByCategory(Long categoryId) {
        log.debug("Fetching menu items for category ID: {}", categoryId);
        List<MenuResponse> items = menuRepository.findByCategoryIdAndIsAvailableTrue(categoryId).stream()
                .map(MenuResponse::fromEntity)
                .collect(Collectors.toList());
        log.debug("Found {} menu items for category ID: {}", items.size(), categoryId);
        return items;
    }

    public MenuResponse getMenuItem(Long id) {
        log.debug("Fetching menu item ID: {}", id);
        Menu menu = menuRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Menu item not found: {}", id);
                    return new RuntimeException("Menu item not found");
                });
        return MenuResponse.fromEntity(menu);
    }

    public List<Category> getAllCategories() {
        log.debug("Fetching all categories");
        List<Category> categories = categoryRepository.findAllByOrderByDisplayOrderAsc();
        log.debug("Found {} categories", categories.size());
        return categories;
    }

    // Admin methods
    @Transactional
    public MenuResponse createMenuItem(String name, String description, BigDecimal price,
                                        Long categoryId, String imageUrl) {
        log.info("Creating new menu item: {}, category ID: {}", name, categoryId);

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> {
                    log.error("Category not found when creating menu item: {}", categoryId);
                    return new RuntimeException("Category not found");
                });

        Menu menu = Menu.builder()
                .name(name)
                .description(description)
                .price(price)
                .category(category)
                .imageUrl(imageUrl)
                .isAvailable(true)
                .build();

        menu = menuRepository.save(menu);
        log.info("Menu item created successfully - ID: {}, name: {}, price: {}", menu.getId(), name, price);
        return MenuResponse.fromEntity(menu);
    }

    @Transactional
    public MenuResponse updateMenuItem(Long id, String name, String description,
                                         BigDecimal price, Long categoryId, String imageUrl, Boolean isAvailable) {
        log.info("Updating menu item ID: {}", id);

        Menu menu = menuRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Menu item not found for update: {}", id);
                    return new RuntimeException("Menu item not found");
                });

        if (name != null) menu.setName(name);
        if (description != null) menu.setDescription(description);
        if (price != null) menu.setPrice(price);
        if (imageUrl != null) menu.setImageUrl(imageUrl);
        if (isAvailable != null) menu.setIsAvailable(isAvailable);

        if (categoryId != null) {
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> {
                        log.error("Category not found for menu update: {}", categoryId);
                        return new RuntimeException("Category not found");
                    });
            menu.setCategory(category);
        }

        menu = menuRepository.save(menu);
        log.info("Menu item updated successfully - ID: {}, name: {}", menu.getId(), menu.getName());
        return MenuResponse.fromEntity(menu);
    }

    @Transactional
    public void deleteMenuItem(Long id) {
        log.info("Deleting menu item ID: {}", id);
        menuRepository.deleteById(id);
        log.info("Menu item deleted successfully - ID: {}", id);
    }
}
