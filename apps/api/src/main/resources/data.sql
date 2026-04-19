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

-- Insert rider users (Password: rider123 - BCrypt encoded)
-- Rider 1: Ahmad (Regular rider)
INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified, two_factor_enabled)
SELECT 'ahmad.rider@apluscafe.com', '$2a$10$bUMjRgRVX0HHhqbSu684/OQp4M2cBwIc4cwh5K5IdJtDwVZ1Rj.P2', 'Ahmad Bin Hassan', 'RIDER', true, true, false
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'ahmad.rider@apluscafe.com');

-- Rider 2: Mei Ling (Regular rider)
INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified, two_factor_enabled)
SELECT 'meiling.rider@apluscafe.com', '$2a$10$bUMjRgRVX0HHhqbSu684/OQp4M2cBwIc4cwh5K5IdJtDwVZ1Rj.P2', 'Tan Mei Ling', 'RIDER', true, true, false
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'meiling.rider@apluscafe.com');

-- Rider 3: SimBot (Simulation rider - will auto-simulate delivery)
INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified, two_factor_enabled)
SELECT 'simbot.rider@apluscafe.com', '$2a$10$bUMjRgRVX0HHhqbSu684/OQp4M2cBwIc4cwh5K5IdJtDwVZ1Rj.P2', 'SimBot (Auto)', 'RIDER', true, true, false
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'simbot.rider@apluscafe.com');

-- Insert rider details for each rider user
-- Note: We use subqueries to get the user IDs since they may vary

-- Rider details for Ahmad
INSERT INTO rider_details (user_id, vehicle_type, license_plate, is_available, current_latitude, current_longitude, rating, total_deliveries)
SELECT id, 'Motorcycle', 'WA 1234 B', true, 2.9772, 101.731, 4.8, 150
FROM users WHERE email = 'ahmad.rider@apluscafe.com'
AND NOT EXISTS (SELECT 1 FROM rider_details rd JOIN users u ON rd.user_id = u.id WHERE u.email = 'ahmad.rider@apluscafe.com');

-- Rider details for Mei Ling
INSERT INTO rider_details (user_id, vehicle_type, license_plate, is_available, current_latitude, current_longitude, rating, total_deliveries)
SELECT id, 'Motorcycle', 'WB 5678 C', true, 2.9772, 101.731, 4.9, 200
FROM users WHERE email = 'meiling.rider@apluscafe.com'
AND NOT EXISTS (SELECT 1 FROM rider_details rd JOIN users u ON rd.user_id = u.id WHERE u.email = 'meiling.rider@apluscafe.com');

-- Rider details for SimBot (Simulation rider - starts at shop location)
INSERT INTO rider_details (user_id, vehicle_type, license_plate, is_available, current_latitude, current_longitude, rating, total_deliveries)
SELECT id, 'E-Bike', 'SIM-BOT', true, 2.9772, 101.731, 5.0, 999
FROM users WHERE email = 'simbot.rider@apluscafe.com'
AND NOT EXISTS (SELECT 1 FROM rider_details rd JOIN users u ON rd.user_id = u.id WHERE u.email = 'simbot.rider@apluscafe.com');

-- ============================================
-- CAFE TABLES (Matching Floor Plan Layout)
-- ============================================
-- Note: Column names from Hibernate naming strategy:
-- table_number, floor_section, is_active (snake_case)
-- positionx, positiony (lowercase concatenated)

-- Window section (circular tables, 2 seats each)
INSERT INTO cafe_tables (table_number, capacity, positionx, positiony, width, height, floor_section, shape, is_active)
SELECT 'W1', 2, 55, 90, 60, 60, 'window', 'ROUND', true
WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = 'W1');

INSERT INTO cafe_tables (table_number, capacity, positionx, positiony, width, height, floor_section, shape, is_active)
SELECT 'W2', 2, 55, 190, 60, 60, 'window', 'ROUND', true
WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = 'W2');

INSERT INTO cafe_tables (table_number, capacity, positionx, positiony, width, height, floor_section, shape, is_active)
SELECT 'W3', 2, 55, 290, 60, 60, 'window', 'ROUND', true
WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = 'W3');

INSERT INTO cafe_tables (table_number, capacity, positionx, positiony, width, height, floor_section, shape, is_active)
SELECT 'W4', 2, 55, 390, 60, 60, 'window', 'ROUND', true
WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = 'W4');

-- Main dining / Center section (rectangular tables, 4 seats each)
INSERT INTO cafe_tables (table_number, capacity, positionx, positiony, width, height, floor_section, shape, is_active)
SELECT 'C1', 4, 190, 110, 100, 70, 'center', 'RECTANGULAR', true
WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = 'C1');

INSERT INTO cafe_tables (table_number, capacity, positionx, positiony, width, height, floor_section, shape, is_active)
SELECT 'C2', 4, 190, 230, 100, 70, 'center', 'RECTANGULAR', true
WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = 'C2');

INSERT INTO cafe_tables (table_number, capacity, positionx, positiony, width, height, floor_section, shape, is_active)
SELECT 'C3', 4, 190, 350, 100, 70, 'center', 'RECTANGULAR', true
WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = 'C3');

INSERT INTO cafe_tables (table_number, capacity, positionx, positiony, width, height, floor_section, shape, is_active)
SELECT 'C4', 4, 350, 110, 100, 70, 'center', 'RECTANGULAR', true
WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = 'C4');

INSERT INTO cafe_tables (table_number, capacity, positionx, positiony, width, height, floor_section, shape, is_active)
SELECT 'C5', 4, 350, 230, 100, 70, 'center', 'RECTANGULAR', true
WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = 'C5');

INSERT INTO cafe_tables (table_number, capacity, positionx, positiony, width, height, floor_section, shape, is_active)
SELECT 'C6', 4, 350, 350, 100, 70, 'center', 'RECTANGULAR', true
WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = 'C6');

-- Group area / Corner section (oval tables for larger groups)
INSERT INTO cafe_tables (table_number, capacity, positionx, positiony, width, height, floor_section, shape, is_active)
SELECT 'L1', 6, 510, 160, 120, 80, 'corner', 'RECTANGULAR', true
WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = 'L1');

INSERT INTO cafe_tables (table_number, capacity, positionx, positiony, width, height, floor_section, shape, is_active)
SELECT 'L2', 6, 510, 270, 120, 80, 'corner', 'RECTANGULAR', true
WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = 'L2');

INSERT INTO cafe_tables (table_number, capacity, positionx, positiony, width, height, floor_section, shape, is_active)
SELECT 'L3', 8, 510, 380, 120, 80, 'corner', 'RECTANGULAR', true
WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = 'L3');

-- Outdoor patio section (rectangular tables, 4 seats each)
INSERT INTO cafe_tables (table_number, capacity, positionx, positiony, width, height, floor_section, shape, is_active)
SELECT 'O1', 4, 135, 520, 80, 60, 'outdoor', 'RECTANGULAR', true
WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = 'O1');

INSERT INTO cafe_tables (table_number, capacity, positionx, positiony, width, height, floor_section, shape, is_active)
SELECT 'O2', 4, 255, 520, 80, 60, 'outdoor', 'RECTANGULAR', true
WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = 'O2');

INSERT INTO cafe_tables (table_number, capacity, positionx, positiony, width, height, floor_section, shape, is_active)
SELECT 'O3', 4, 375, 520, 80, 60, 'outdoor', 'RECTANGULAR', true
WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = 'O3');
