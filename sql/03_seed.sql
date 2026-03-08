SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

USE jewelry_salon_db;

INSERT INTO roles (code, name) VALUES
('admin', 'Администратор'),
('manager', 'Менеджер'),
('client', 'Клиент'),
('courier', 'Курьер');

-- Пароль для всех тестовых пользователей: 123456
-- bcrypt hash: $2b$10$ROTl4rKCA8FKvb/IEHk9IuzDBAQ1lOlWro9Wi9UzlugAYVc2vMrqe
INSERT INTO users (role_id, full_name, email, phone, password_hash, is_active) VALUES
((SELECT id FROM roles WHERE code='admin'), 'Главный Админ', 'admin@aurum.local', '+79990000001', '$2b$10$ROTl4rKCA8FKvb/IEHk9IuzDBAQ1lOlWro9Wi9UzlugAYVc2vMrqe', 1),
((SELECT id FROM roles WHERE code='manager'), 'Контент Менеджер', 'manager@aurum.local', '+79990000002', '$2b$10$ROTl4rKCA8FKvb/IEHk9IuzDBAQ1lOlWro9Wi9UzlugAYVc2vMrqe', 1),
((SELECT id FROM roles WHERE code='courier'), 'Курьер Сервиса', 'courier@aurum.local', '+79990000003', '$2b$10$ROTl4rKCA8FKvb/IEHk9IuzDBAQ1lOlWro9Wi9UzlugAYVc2vMrqe', 1),
((SELECT id FROM roles WHERE code='client'), 'Тест Клиент', 'client@aurum.local', '+79990000004', '$2b$10$ROTl4rKCA8FKvb/IEHk9IuzDBAQ1lOlWro9Wi9UzlugAYVc2vMrqe', 1);

INSERT INTO categories (name, slug) VALUES
('Кольца', 'koltsa'),
('Серьги', 'sergi'),
('Браслеты', 'braslety'),
('Кулоны', 'kulony');

INSERT INTO products (category_id, name, slug, description, sku, price, max_discount_percent, stock_quantity, is_active) VALUES
((SELECT id FROM categories WHERE slug='koltsa'), 'Кольцо Белое Золото 585', 'koltso-beloe-zoloto-585', 'Классическое кольцо из белого золота с фианитами.', 'AUR-R-001', 45000.00, 40.00, 12, 1),
((SELECT id FROM categories WHERE slug='sergi'), 'Серьги Сапфировый Вечер', 'sergi-sapfirovyi-vecher', 'Элегантные серьги с сапфировой вставкой.', 'AUR-E-002', 62000.00, 40.00, 7, 1),
((SELECT id FROM categories WHERE slug='braslety'), 'Браслет Империя', 'braslet-imperiya', 'Массивный браслет с геометрическим узором.', 'AUR-B-003', 39000.00, 40.00, 15, 1),
((SELECT id FROM categories WHERE slug='kulony'), 'Кулон Элегия', 'kulon-elegiya', 'Лаконичный кулон для ежедневного образа.', 'AUR-P-004', 28500.00, 40.00, 20, 1);

INSERT INTO product_images (product_id, image_path, alt_text, sort_order) VALUES
((SELECT id FROM products WHERE sku='AUR-R-001'), 'products/ring-1.jpg', 'Кольцо Белое Золото 585', 1),
((SELECT id FROM products WHERE sku='AUR-E-002'), 'products/earrings-1.jpg', 'Серьги Сапфировый Вечер', 1),
((SELECT id FROM products WHERE sku='AUR-B-003'), 'products/bracelet-1.jpg', 'Браслет Империя', 1),
((SELECT id FROM products WHERE sku='AUR-P-004'), 'products/pendant-1.jpg', 'Кулон Элегия', 1);

INSERT INTO delivery_slots (label, start_time, end_time) VALUES
('09:00 - 10:00', '09:00:00', '10:00:00'),
('10:00 - 11:00', '10:00:00', '11:00:00'),
('11:00 - 12:00', '11:00:00', '12:00:00'),
('12:00 - 13:00', '12:00:00', '13:00:00'),
('13:00 - 14:00', '13:00:00', '14:00:00'),
('14:00 - 15:00', '14:00:00', '15:00:00'),
('15:00 - 16:00', '15:00:00', '16:00:00'),
('16:00 - 17:00', '16:00:00', '17:00:00'),
('17:00 - 18:00', '17:00:00', '18:00:00'),
('18:00 - 19:00', '18:00:00', '19:00:00'),
('19:00 - 20:00', '19:00:00', '20:00:00'),
('20:00 - 21:00', '20:00:00', '21:00:00');

-- Скидки
INSERT INTO discount_rules (name, description_text, scope, discount_type, discount_value, stackable, min_order_amount, max_order_amount, start_at, end_at, is_active) VALUES
('Весенний каталог 10%', 'Скидка на весь каталог', 'catalog', 'percent', 10.00, 1, NULL, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), 1),
('Категория кольца - 5%', 'Дополнительная скидка на кольца', 'category', 'percent', 5.00, 1, NULL, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), 1),
('Премиум товар -3000', 'Фикс скидка на отдельный товар', 'product', 'fixed', 3000.00, 1, NULL, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), 1),
('Скидка от суммы 100000', 'Скидка при крупном заказе', 'order_sum', 'percent', 7.00, 1, 100000.00, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), 1),
('Промокод WELCOME7', 'Промокод для первого заказа', 'order_sum', 'percent', 7.00, 1, NULL, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY), 1);

INSERT INTO discount_targets_catalog (discount_rule_id)
SELECT id FROM discount_rules WHERE name = 'Весенний каталог 10%';

INSERT INTO discount_targets_categories (discount_rule_id, category_id)
SELECT dr.id, c.id
FROM discount_rules dr
JOIN categories c ON c.slug='koltsa'
WHERE dr.name='Категория кольца - 5%';

INSERT INTO discount_targets_products (discount_rule_id, product_id)
SELECT dr.id, p.id
FROM discount_rules dr
JOIN products p ON p.sku='AUR-E-002'
WHERE dr.name='Премиум товар -3000';

INSERT INTO promo_codes (code, discount_rule_id, max_uses, is_active)
SELECT 'WELCOME7', dr.id, 1000, 1
FROM discount_rules dr
WHERE dr.name='Промокод WELCOME7';

INSERT INTO product_stats (product_id, views_count, cart_add_count, wishlist_add_count, order_count, reviews_count)
SELECT id, 0, 0, 0, 0, 0 FROM products;

-- Дополнительные пользователи (пароль: 123456)
INSERT INTO users (role_id, full_name, email, phone, password_hash, is_active) VALUES
((SELECT id FROM roles WHERE code='client'), 'Анна Лебедева', 'anna@aurum.local', '+79990000005', '$2b$10$ROTl4rKCA8FKvb/IEHk9IuzDBAQ1lOlWro9Wi9UzlugAYVc2vMrqe', 1),
((SELECT id FROM roles WHERE code='client'), 'Михаил Соколов', 'mikhail@aurum.local', '+79990000006', '$2b$10$ROTl4rKCA8FKvb/IEHk9IuzDBAQ1lOlWro9Wi9UzlugAYVc2vMrqe', 1),
((SELECT id FROM roles WHERE code='client'), 'Екатерина Воронова', 'ekaterina@aurum.local', '+79990000007', '$2b$10$ROTl4rKCA8FKvb/IEHk9IuzDBAQ1lOlWro9Wi9UzlugAYVc2vMrqe', 1);

-- Дополнительные категории
INSERT INTO categories (name, slug) VALUES
('Цепочки', 'tsepochki'),
('Подвески', 'podveski');

-- Дополнительные товары
INSERT INTO products (category_id, name, slug, description, sku, price, max_discount_percent, stock_quantity, is_active) VALUES
((SELECT id FROM categories WHERE slug='koltsa'), 'Кольцо Корона Бриллиант', 'koltso-korona-brilliant', 'Кольцо с центральным камнем и дорожкой из фианитов.', 'AUR-R-005', 78000.00, 40.00, 5, 1),
((SELECT id FROM categories WHERE slug='sergi'), 'Серьги Лунный Блеск', 'sergi-lunnyi-blesk', 'Серьги из белого золота с подвесной частью.', 'AUR-E-006', 54000.00, 40.00, 9, 1),
((SELECT id FROM categories WHERE slug='braslety'), 'Браслет Аврора', 'braslet-avrora', 'Тонкий браслет на каждый день.', 'AUR-B-007', 26000.00, 40.00, 18, 1),
((SELECT id FROM categories WHERE slug='kulony'), 'Кулон Северная Звезда', 'kulon-severnaya-zvezda', 'Кулон-звезда с сапфировой крошкой.', 'AUR-P-008', 31500.00, 40.00, 13, 1),
((SELECT id FROM categories WHERE slug='tsepochki'), 'Цепочка Венеция', 'tsepochka-venetsiya', 'Классическое плетение для кулонов.', 'AUR-C-009', 22800.00, 40.00, 30, 1),
((SELECT id FROM categories WHERE slug='podveski'), 'Подвеска Сердце', 'podveska-serdtse', 'Минималистичная подвеска в форме сердца.', 'AUR-D-010', 17400.00, 40.00, 25, 1),
((SELECT id FROM categories WHERE slug='koltsa'), 'Кольцо Имперский Вензель', 'koltso-imperskii-venzel', 'Выразительное кольцо с ажурным узором.', 'AUR-R-011', 69000.00, 40.00, 6, 1),
((SELECT id FROM categories WHERE slug='sergi'), 'Серьги Капля Росы', 'sergi-kaplya-rosy', 'Лёгкие серьги-капли для вечерних образов.', 'AUR-E-012', 34800.00, 40.00, 14, 1);

INSERT INTO product_images (product_id, image_path, alt_text, sort_order) VALUES
((SELECT id FROM products WHERE sku='AUR-R-005'), 'products/ring-2.jpg', 'Кольцо Корона Бриллиант', 1),
((SELECT id FROM products WHERE sku='AUR-E-006'), 'products/earrings-2.jpg', 'Серьги Лунный Блеск', 1),
((SELECT id FROM products WHERE sku='AUR-B-007'), 'products/bracelet-2.jpg', 'Браслет Аврора', 1),
((SELECT id FROM products WHERE sku='AUR-P-008'), 'products/pendant-2.jpg', 'Кулон Северная Звезда', 1),
((SELECT id FROM products WHERE sku='AUR-C-009'), 'products/chain-1.jpg', 'Цепочка Венеция', 1),
((SELECT id FROM products WHERE sku='AUR-D-010'), 'products/pendant-3.jpg', 'Подвеска Сердце', 1),
((SELECT id FROM products WHERE sku='AUR-R-011'), 'products/ring-3.jpg', 'Кольцо Имперский Вензель', 1),
((SELECT id FROM products WHERE sku='AUR-E-012'), 'products/earrings-3.jpg', 'Серьги Капля Росы', 1);

INSERT INTO product_stats (product_id, views_count, cart_add_count, wishlist_add_count, order_count, reviews_count)
SELECT p.id, 0, 0, 0, 0, 0
FROM products p
LEFT JOIN product_stats ps ON ps.product_id = p.id
WHERE ps.product_id IS NULL;

-- Адреса клиентов
INSERT INTO user_addresses (user_id, city, street, house, apartment, comment_text, is_default) VALUES
((SELECT id FROM users WHERE email='client@aurum.local'), 'Москва', 'Тверская', '12', '45', 'Домофон 45', 1),
((SELECT id FROM users WHERE email='anna@aurum.local'), 'Санкт-Петербург', 'Невский проспект', '102', '17', NULL, 1),
((SELECT id FROM users WHERE email='mikhail@aurum.local'), 'Казань', 'Баумана', '8', '21', 'Позвонить за 20 минут', 1),
((SELECT id FROM users WHERE email='ekaterina@aurum.local'), 'Екатеринбург', 'Ленина', '55', '13', NULL, 1);

-- Заказы (часть delivered для отзывов)
INSERT INTO orders (user_id, address_id, slot_id, phone, comment_text, subtotal, discount_total, total, status) VALUES
((SELECT id FROM users WHERE email='client@aurum.local'), (SELECT id FROM user_addresses WHERE user_id=(SELECT id FROM users WHERE email='client@aurum.local') LIMIT 1), 1, '+79990000004', 'Позвонить перед доставкой', 107000.00, 12000.00, 95000.00, 'delivered'),
((SELECT id FROM users WHERE email='anna@aurum.local'), (SELECT id FROM user_addresses WHERE user_id=(SELECT id FROM users WHERE email='anna@aurum.local') LIMIT 1), 2, '+79990000005', NULL, 54000.00, 7000.00, 47000.00, 'confirmed'),
((SELECT id FROM users WHERE email='mikhail@aurum.local'), (SELECT id FROM user_addresses WHERE user_id=(SELECT id FROM users WHERE email='mikhail@aurum.local') LIMIT 1), 3, '+79990000006', 'Оставить у охраны', 48800.00, 4800.00, 44000.00, 'delivered'),
((SELECT id FROM users WHERE email='ekaterina@aurum.local'), (SELECT id FROM user_addresses WHERE user_id=(SELECT id FROM users WHERE email='ekaterina@aurum.local') LIMIT 1), 4, '+79990000007', NULL, 31500.00, 3150.00, 28350.00, 'new');

INSERT INTO order_items (order_id, product_id, unit_price, quantity, discount_percent_applied, discount_fixed_applied, final_unit_price, line_total) VALUES
((SELECT id FROM orders WHERE user_id=(SELECT id FROM users WHERE email='client@aurum.local') ORDER BY id ASC LIMIT 1), (SELECT id FROM products WHERE sku='AUR-R-001'), 45000.00, 1, 10.00, 0, 40500.00, 40500.00),
((SELECT id FROM orders WHERE user_id=(SELECT id FROM users WHERE email='client@aurum.local') ORDER BY id ASC LIMIT 1), (SELECT id FROM products WHERE sku='AUR-E-002'), 62000.00, 1, 12.00, 3000.00, 54500.00, 54500.00),
((SELECT id FROM orders WHERE user_id=(SELECT id FROM users WHERE email='anna@aurum.local') ORDER BY id ASC LIMIT 1), (SELECT id FROM products WHERE sku='AUR-E-006'), 54000.00, 1, 10.00, 0, 48600.00, 48600.00),
((SELECT id FROM orders WHERE user_id=(SELECT id FROM users WHERE email='mikhail@aurum.local') ORDER BY id ASC LIMIT 1), (SELECT id FROM products WHERE sku='AUR-C-009'), 22800.00, 1, 10.00, 0, 20520.00, 20520.00),
((SELECT id FROM orders WHERE user_id=(SELECT id FROM users WHERE email='mikhail@aurum.local') ORDER BY id ASC LIMIT 1), (SELECT id FROM products WHERE sku='AUR-D-010'), 17400.00, 1, 10.00, 0, 15660.00, 15660.00),
((SELECT id FROM orders WHERE user_id=(SELECT id FROM users WHERE email='ekaterina@aurum.local') ORDER BY id ASC LIMIT 1), (SELECT id FROM products WHERE sku='AUR-P-008'), 31500.00, 1, 10.00, 0, 28350.00, 28350.00);

INSERT INTO order_status_history (order_id, status, changed_by) VALUES
((SELECT id FROM orders WHERE user_id=(SELECT id FROM users WHERE email='client@aurum.local') ORDER BY id ASC LIMIT 1), 'new', (SELECT id FROM users WHERE email='manager@aurum.local')),
((SELECT id FROM orders WHERE user_id=(SELECT id FROM users WHERE email='client@aurum.local') ORDER BY id ASC LIMIT 1), 'delivery', (SELECT id FROM users WHERE email='courier@aurum.local')),
((SELECT id FROM orders WHERE user_id=(SELECT id FROM users WHERE email='client@aurum.local') ORDER BY id ASC LIMIT 1), 'delivered', (SELECT id FROM users WHERE email='courier@aurum.local')),
((SELECT id FROM orders WHERE user_id=(SELECT id FROM users WHERE email='mikhail@aurum.local') ORDER BY id ASC LIMIT 1), 'new', (SELECT id FROM users WHERE email='manager@aurum.local')),
((SELECT id FROM orders WHERE user_id=(SELECT id FROM users WHERE email='mikhail@aurum.local') ORDER BY id ASC LIMIT 1), 'delivered', (SELECT id FROM users WHERE email='courier@aurum.local'));

-- Использование промокода
INSERT INTO order_promo_codes (order_id, promo_code_id, discount_amount) VALUES
((SELECT id FROM orders WHERE user_id=(SELECT id FROM users WHERE email='client@aurum.local') ORDER BY id ASC LIMIT 1), (SELECT id FROM promo_codes WHERE code='WELCOME7' LIMIT 1), 6650.00);

INSERT INTO user_promo_usages (user_id, promo_code_id, order_id) VALUES
((SELECT id FROM users WHERE email='client@aurum.local'), (SELECT id FROM promo_codes WHERE code='WELCOME7' LIMIT 1), (SELECT id FROM orders WHERE user_id=(SELECT id FROM users WHERE email='client@aurum.local') ORDER BY id ASC LIMIT 1));

-- Отзывы
INSERT INTO reviews_product (user_id, product_id, rating, comment_text, is_published) VALUES
((SELECT id FROM users WHERE email='client@aurum.local'), (SELECT id FROM products WHERE sku='AUR-R-001'), 5, 'Очень изящное кольцо, вживую выглядит еще лучше.', 1),
((SELECT id FROM users WHERE email='mikhail@aurum.local'), (SELECT id FROM products WHERE sku='AUR-C-009'), 4, 'Качество отличное, доставка вовремя.', 1);

INSERT INTO reviews_store (user_id, rating, comment_text, is_published) VALUES
((SELECT id FROM users WHERE email='client@aurum.local'), 5, 'Отличный сервис и вежливый курьер.', 1),
((SELECT id FROM users WHERE email='mikhail@aurum.local'), 4, 'Хороший выбор украшений, удобный интерфейс.', 1);

-- Избранное и корзины
INSERT INTO wishlists (user_id) VALUES
((SELECT id FROM users WHERE email='client@aurum.local')),
((SELECT id FROM users WHERE email='anna@aurum.local'));

INSERT INTO wishlist_items (wishlist_id, product_id) VALUES
((SELECT id FROM wishlists WHERE user_id=(SELECT id FROM users WHERE email='client@aurum.local') LIMIT 1), (SELECT id FROM products WHERE sku='AUR-R-005')),
((SELECT id FROM wishlists WHERE user_id=(SELECT id FROM users WHERE email='anna@aurum.local') LIMIT 1), (SELECT id FROM products WHERE sku='AUR-P-008'));

INSERT INTO carts (user_id, status) VALUES
((SELECT id FROM users WHERE email='anna@aurum.local'), 'active'),
((SELECT id FROM users WHERE email='ekaterina@aurum.local'), 'active');

INSERT INTO cart_items (cart_id, product_id, quantity) VALUES
((SELECT id FROM carts WHERE user_id=(SELECT id FROM users WHERE email='anna@aurum.local') AND status='active' LIMIT 1), (SELECT id FROM products WHERE sku='AUR-E-006'), 1),
((SELECT id FROM carts WHERE user_id=(SELECT id FROM users WHERE email='ekaterina@aurum.local') AND status='active' LIMIT 1), (SELECT id FROM products WHERE sku='AUR-E-012'), 2);

-- Движения склада
INSERT INTO inventory_movements (product_id, movement_type, quantity, reason_text, created_by) VALUES
((SELECT id FROM products WHERE sku='AUR-R-001'), 'in', 20, 'initial stock', (SELECT id FROM users WHERE email='manager@aurum.local')),
((SELECT id FROM products WHERE sku='AUR-E-002'), 'in', 15, 'initial stock', (SELECT id FROM users WHERE email='manager@aurum.local')),
((SELECT id FROM products WHERE sku='AUR-C-009'), 'out', 1, 'order checkout', (SELECT id FROM users WHERE email='manager@aurum.local'));

-- Актуализируем статистику товаров
UPDATE product_stats SET views_count = 128, cart_add_count = 27, wishlist_add_count = 19, order_count = 11, reviews_count = 3 WHERE product_id = (SELECT id FROM products WHERE sku='AUR-R-001');
UPDATE product_stats SET views_count = 101, cart_add_count = 20, wishlist_add_count = 14, order_count = 9, reviews_count = 2 WHERE product_id = (SELECT id FROM products WHERE sku='AUR-E-002');
UPDATE product_stats SET views_count = 88, cart_add_count = 16, wishlist_add_count = 13, order_count = 8, reviews_count = 2 WHERE product_id = (SELECT id FROM products WHERE sku='AUR-C-009');
UPDATE product_stats SET views_count = 74, cart_add_count = 14, wishlist_add_count = 12, order_count = 7, reviews_count = 1 WHERE product_id = (SELECT id FROM products WHERE sku='AUR-P-008');

