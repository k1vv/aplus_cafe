-- Insert default categories
INSERT INTO categories (name, description, display_order) VALUES
    ('Coffee', 'Hot and cold coffee beverages', 1),
    ('Pastry', 'Fresh baked goods and pastries', 2),
    ('Food', 'Main dishes and meals', 3),
    ('Drinks', 'Non-coffee beverages', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert default reservation time slots (30 minute intervals from 9 AM to 9 PM)
INSERT INTO reservation_slots (start_time, is_active) VALUES
    ('09:00:00', true),
    ('09:30:00', true),
    ('10:00:00', true),
    ('10:30:00', true),
    ('11:00:00', true),
    ('11:30:00', true),
    ('12:00:00', true),
    ('12:30:00', true),
    ('13:00:00', true),
    ('13:30:00', true),
    ('14:00:00', true),
    ('14:30:00', true),
    ('15:00:00', true),
    ('15:30:00', true),
    ('16:00:00', true),
    ('16:30:00', true),
    ('17:00:00', true),
    ('17:30:00', true),
    ('18:00:00', true),
    ('18:30:00', true),
    ('19:00:00', true),
    ('19:30:00', true),
    ('20:00:00', true),
    ('20:30:00', true),
    ('21:00:00', true)
ON CONFLICT DO NOTHING;

-- Insert sample cafe tables for layout
INSERT INTO cafe_tables (table_number, capacity, position_x, position_y, floor_section, shape, is_active) VALUES
    ('T1', 2, 10, 10, 'indoor', 'SQUARE', true),
    ('T2', 2, 30, 10, 'indoor', 'SQUARE', true),
    ('T3', 4, 50, 10, 'indoor', 'RECTANGULAR', true),
    ('T4', 4, 70, 10, 'indoor', 'RECTANGULAR', true),
    ('T5', 2, 10, 30, 'indoor', 'ROUND', true),
    ('T6', 2, 30, 30, 'indoor', 'ROUND', true),
    ('T7', 6, 50, 30, 'indoor', 'RECTANGULAR', true),
    ('T8', 4, 70, 30, 'indoor', 'SQUARE', true),
    ('T9', 2, 10, 50, 'outdoor', 'ROUND', true),
    ('T10', 2, 30, 50, 'outdoor', 'ROUND', true),
    ('T11', 4, 50, 50, 'outdoor', 'SQUARE', true),
    ('T12', 4, 70, 50, 'outdoor', 'SQUARE', true)
ON CONFLICT (table_number) DO NOTHING;

-- Insert menu items
-- Coffee items (category_id = 1)
INSERT INTO menu (category_id, name, description, price, image_url, is_available) VALUES
    (1, 'Café Latte', 'Smooth espresso with steamed milk and a layer of foam', 6.50, '/images/cafe-latte.jpg', true),
    (1, 'Cappuccino', 'Rich espresso with velvety steamed milk and thick foam', 6.50, '/images/cafe-cappuccino.jpg', true),
    (1, 'Iced Coffee', 'Double-shot espresso over ice with fresh milk', 7.00, '/images/cafe-iced-coffee.jpg', true),
    (1, 'Matcha Latte', 'Premium Japanese matcha whisked with oat milk', 7.50, '/images/cafe-matcha.jpg', true),
    (1, 'Café Mocha', 'Espresso blended with chocolate and topped with cream', 8.00, '/images/cafe-mocha.jpg', true),
    (1, 'Affogato', 'Vanilla gelato drowned in a shot of hot espresso', 9.50, '/images/cafe-affogato.jpg', true)
ON CONFLICT DO NOTHING;

-- Pastry items (category_id = 2)
INSERT INTO menu (category_id, name, description, price, image_url, is_available) VALUES
    (2, 'Butter Croissant', 'Flaky, golden French croissant — freshly baked daily', 4.90, '/images/cafe-croissant.jpg', true),
    (2, 'Blueberry Muffin', 'Soft and fluffy muffin loaded with fresh blueberries', 5.50, '/images/cafe-muffin.jpg', true),
    (2, 'Cinnamon Roll', 'Warm swirl of cinnamon with sweet cream cheese glaze', 6.90, '/images/cafe-cinnamon-roll.jpg', true),
    (2, 'Chocolate Cake', 'Rich double-layer chocolate cake with ganache frosting', 10.90, '/images/cafe-choc-cake.jpg', true),
    (2, 'Scone with Jam', 'Freshly baked scone served with clotted cream and jam', 5.90, '/images/cafe-scone.jpg', true),
    (2, 'Tiramisu', 'Mascarpone cream, espresso-soaked ladyfingers and cocoa', 9.90, '/images/cafe-tiramisu.jpg', true)
ON CONFLICT DO NOTHING;
