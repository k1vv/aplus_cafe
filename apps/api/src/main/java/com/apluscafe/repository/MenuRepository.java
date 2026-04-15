package com.apluscafe.repository;

import com.apluscafe.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuRepository extends JpaRepository<Menu, Long> {

    List<Menu> findByCategoryId(Long categoryId);

    List<Menu> findByIsAvailableTrue();

    List<Menu> findByCategoryIdAndIsAvailableTrue(Long categoryId);
}
