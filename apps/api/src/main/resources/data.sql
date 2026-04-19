-- Insert default admin user (using users table with ADMIN role)
-- Email: admin@gmail.com, Password: admin123 (BCrypt encoded)
INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified, two_factor_enabled)
SELECT 'admin@gmail.com', '$2a$10$bUMjRgRVX0HHhqbSu684/OQp4M2cBwIc4cwh5K5IdJtDwVZ1Rj.P2', 'Admin User', 'ADMIN', true, true, false
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@gmail.com');

-- Insert default categories if not exists
INSERT INTO categories (name, description, display_order)
SELECT 'Coffee', 'Hot and cold coffee beverages', 1
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Coffee');

INSERT INTO categories (name, description, display_order)
SELECT 'Pastry', 'Fresh baked goods and pastries', 2
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pastry');

INSERT INTO categories (name, description, display_order)
SELECT 'Food', 'Main dishes and meals', 3
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Food');

INSERT INTO categories (name, description, display_order)
SELECT 'Drinks', 'Non-coffee beverages', 4
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Drinks');

-- Insert menu items - Coffee (category_id = 1)
INSERT INTO menu (category_id, name, description, price, image_url, is_available)
SELECT 1, 'Café Latte', 'Smooth espresso with steamed milk and a layer of foam', 6.50, '/images/cafe-latte.jpg', true
WHERE NOT EXISTS (SELECT 1 FROM menu WHERE name = 'Café Latte');

INSERT INTO menu (category_id, name, description, price, image_url, is_available)
SELECT 1, 'Cappuccino', 'Rich espresso with velvety steamed milk and thick foam', 6.50, '/images/cafe-cappuccino.jpg', true
WHERE NOT EXISTS (SELECT 1 FROM menu WHERE name = 'Cappuccino');

INSERT INTO menu (category_id, name, description, price, image_url, is_available)
SELECT 1, 'Iced Coffee', 'Double-shot espresso over ice with fresh milk', 7.00, '/images/cafe-iced-coffee.jpg', true
WHERE NOT EXISTS (SELECT 1 FROM menu WHERE name = 'Iced Coffee');

INSERT INTO menu (category_id, name, description, price, image_url, is_available)
SELECT 1, 'Matcha Latte', 'Premium Japanese matcha whisked with oat milk', 7.50, '/images/cafe-matcha.jpg', true
WHERE NOT EXISTS (SELECT 1 FROM menu WHERE name = 'Matcha Latte');

INSERT INTO menu (category_id, name, description, price, image_url, is_available)
SELECT 1, 'Café Mocha', 'Espresso blended with chocolate and topped with cream', 8.00, '/images/cafe-mocha.jpg', true
WHERE NOT EXISTS (SELECT 1 FROM menu WHERE name = 'Café Mocha');

INSERT INTO menu (category_id, name, description, price, image_url, is_available)
SELECT 1, 'Affogato', 'Vanilla gelato drowned in a shot of hot espresso', 9.50, '/images/cafe-affogato.jpg', true
WHERE NOT EXISTS (SELECT 1 FROM menu WHERE name = 'Affogato');

-- Insert menu items - Pastry (category_id = 2)
INSERT INTO menu (category_id, name, description, price, image_url, is_available)
SELECT 2, 'Butter Croissant', 'Flaky, golden French croissant — freshly baked daily', 4.90, '/images/cafe-croissant.jpg', true
WHERE NOT EXISTS (SELECT 1 FROM menu WHERE name = 'Butter Croissant');

INSERT INTO menu (category_id, name, description, price, image_url, is_available)
SELECT 2, 'Blueberry Muffin', 'Soft and fluffy muffin loaded with fresh blueberries', 5.50, '/images/cafe-muffin.jpg', true
WHERE NOT EXISTS (SELECT 1 FROM menu WHERE name = 'Blueberry Muffin');

INSERT INTO menu (category_id, name, description, price, image_url, is_available)
SELECT 2, 'Cinnamon Roll', 'Warm swirl of cinnamon with sweet cream cheese glaze', 6.90, '/images/cafe-cinnamon-roll.jpg', true
WHERE NOT EXISTS (SELECT 1 FROM menu WHERE name = 'Cinnamon Roll');

INSERT INTO menu (category_id, name, description, price, image_url, is_available)
SELECT 2, 'Chocolate Cake', 'Rich double-layer chocolate cake with ganache frosting', 10.90, '/images/cafe-choc-cake.jpg', true
WHERE NOT EXISTS (SELECT 1 FROM menu WHERE name = 'Chocolate Cake');

INSERT INTO menu (category_id, name, description, price, image_url, is_available)
SELECT 2, 'Scone with Jam', 'Freshly baked scone served with clotted cream and jam', 5.90, '/images/cafe-scone.jpg', true
WHERE NOT EXISTS (SELECT 1 FROM menu WHERE name = 'Scone with Jam');

INSERT INTO menu (category_id, name, description, price, image_url, is_available)
SELECT 2, 'Tiramisu', 'Mascarpone cream, espresso-soaked ladyfingers and cocoa', 9.90, '/images/cafe-tiramisu.jpg', true
WHERE NOT EXISTS (SELECT 1 FROM menu WHERE name = 'Tiramisu');
