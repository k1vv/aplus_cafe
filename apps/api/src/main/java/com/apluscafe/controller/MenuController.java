package com.apluscafe.controller;

import com.apluscafe.dto.response.MenuResponse;
import com.apluscafe.entity.Category;
import com.apluscafe.service.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @GetMapping("/menu")
    public ResponseEntity<List<MenuResponse>> getAllMenuItems() {
        return ResponseEntity.ok(menuService.getAvailableMenuItems());
    }

    @GetMapping("/menu/{id}")
    public ResponseEntity<MenuResponse> getMenuItem(@PathVariable Long id) {
        return ResponseEntity.ok(menuService.getMenuItem(id));
    }

    @GetMapping("/menu/category/{categoryId}")
    public ResponseEntity<List<MenuResponse>> getMenuItemsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(menuService.getMenuItemsByCategory(categoryId));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(menuService.getAllCategories());
    }
}
