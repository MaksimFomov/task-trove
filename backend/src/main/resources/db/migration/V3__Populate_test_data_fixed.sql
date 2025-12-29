-- V3: Наполнение базы данных тестовыми данными (исправленная версия)
-- Эта миграция создает тестовые данные для всех моделей с учетом всех возможных вариантов использования на фронте

-- Пароли для всех тестовых пользователей: "password123"
-- BCrypt hash для "password123": $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

-- ============================================
-- 1. ДОПОЛНИТЕЛЬНЫЕ АККАУНТЫ (роли уже созданы в V1)
-- ============================================

-- Заказчики
INSERT INTO accounts (email, password, is_active, role_id) VALUES
('customer1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 3),
('customer2@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 3),
('customer3@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 3),
('customer4@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 3)
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- Исполнители
INSERT INTO accounts (email, password, is_active, role_id) VALUES
('performer1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 4),
('performer2@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 4),
('performer3@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 4),
('performer4@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 4),
('performer5@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 4)
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- Администраторы
INSERT INTO accounts (email, password, is_active, role_id) VALUES
('admin1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 2),
('admin2@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 2)
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- ============================================
-- 2. ЗАКАЗЧИКИ (CUSTOMERS)
-- ============================================

INSERT INTO customers (account_id, first_name, last_name, middle_name) 
SELECT a.id, 'Иван', 'Иванов', 'Иванович' FROM accounts a WHERE a.email = 'customer1@test.com'
ON DUPLICATE KEY UPDATE last_name=VALUES(last_name);

INSERT INTO customers (account_id, first_name, last_name, middle_name) 
SELECT a.id, 'Мария', 'Петрова', 'Сергеевна' FROM accounts a WHERE a.email = 'customer2@test.com'
ON DUPLICATE KEY UPDATE last_name=VALUES(last_name);

INSERT INTO customers (account_id, first_name, last_name, middle_name) 
SELECT a.id, 'Алексей', 'Сидоров', 'Владимирович' FROM accounts a WHERE a.email = 'customer3@test.com'
ON DUPLICATE KEY UPDATE last_name=VALUES(last_name);

INSERT INTO customers (account_id, first_name, last_name, middle_name) 
SELECT a.id, 'Елена', 'Козлова', 'Дмитриевна' FROM accounts a WHERE a.email = 'customer4@test.com'
ON DUPLICATE KEY UPDATE last_name=VALUES(last_name);

-- ============================================
-- 3. ИСПОЛНИТЕЛИ (PERFORMERS)
-- ============================================

INSERT INTO performers (account_id, age, first_name, last_name, middle_name, rating) 
SELECT a.id, 28, 'Дмитрий', 'Смирнов', 'Александрович', 5 FROM accounts a WHERE a.email = 'performer1@test.com'
ON DUPLICATE KEY UPDATE last_name=VALUES(last_name);

INSERT INTO performers (account_id, age, first_name, last_name, middle_name, rating) 
SELECT a.id, 32, 'Анна', 'Волкова', 'Петровна', 4 FROM accounts a WHERE a.email = 'performer2@test.com'
ON DUPLICATE KEY UPDATE last_name=VALUES(last_name);

INSERT INTO performers (account_id, age, first_name, last_name, middle_name, rating) 
SELECT a.id, 25, 'Сергей', 'Лебедев', 'Игоревич', 5 FROM accounts a WHERE a.email = 'performer3@test.com'
ON DUPLICATE KEY UPDATE last_name=VALUES(last_name);

INSERT INTO performers (account_id, age, first_name, last_name, middle_name, rating) 
SELECT a.id, 29, 'Ольга', 'Новикова', 'Викторовна', 4 FROM accounts a WHERE a.email = 'performer4@test.com'
ON DUPLICATE KEY UPDATE last_name=VALUES(last_name);

INSERT INTO performers (account_id, age, first_name, last_name, middle_name, rating) 
SELECT a.id, 35, 'Андрей', 'Морозов', 'Николаевич', 5 FROM accounts a WHERE a.email = 'performer5@test.com'
ON DUPLICATE KEY UPDATE last_name=VALUES(last_name);

-- ============================================
-- 4. АДМИНИСТРАТОРЫ (ADMINISTRATORS)
-- ============================================

INSERT INTO administrators (name, account_id) 
SELECT 'Администратор 1', a.id FROM accounts a WHERE a.email = 'admin1@test.com'
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO administrators (name, account_id) 
SELECT 'Администратор 2', a.id FROM accounts a WHERE a.email = 'admin2@test.com'
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ============================================
-- 5. ПОРТФОЛИО (PORTFOLIOS)
-- ============================================

-- Портфолио заказчиков
INSERT INTO portfolios (customer_id, performer_id, owner_type, name, phone, email, town_country, specializations, employment, experience, description, scope_s, is_active) 
SELECT c.id, NULL, 'CUSTOMER', 'Иванов Иван Иванович', '+7 (999) 123-45-67', 'customer1@test.com', 'Москва, Россия', NULL, NULL, NULL, 'Опытный заказчик в сфере IT и разработки. Ищу качественных исполнителей для реализации проектов.', 'IT и технологии, Маркетинг и реклама', true 
FROM customers c JOIN accounts a ON c.account_id = a.id WHERE a.email = 'customer1@test.com'
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO portfolios (customer_id, performer_id, owner_type, name, phone, email, town_country, specializations, employment, experience, description, scope_s, is_active) 
SELECT c.id, NULL, 'CUSTOMER', 'Петрова Мария Сергеевна', '+7 (999) 234-56-78', 'customer2@test.com', 'Санкт-Петербург, Россия', NULL, NULL, NULL, 'Заказчик с опытом работы в дизайне и маркетинге. Требую высокого качества исполнения.', 'Дизайн и творчество, Маркетинг и реклама', true 
FROM customers c JOIN accounts a ON c.account_id = a.id WHERE a.email = 'customer2@test.com'
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO portfolios (customer_id, performer_id, owner_type, name, phone, email, town_country, specializations, employment, experience, description, scope_s, is_active) 
SELECT c.id, NULL, 'CUSTOMER', 'Сидоров Алексей Владимирович', '+7 (999) 345-67-89', 'customer3@test.com', 'Екатеринбург, Россия', NULL, NULL, NULL, 'Предприниматель, нуждаюсь в IT-решениях для бизнеса.', 'IT и технологии, Финансы, Консалтинг', true 
FROM customers c JOIN accounts a ON c.account_id = a.id WHERE a.email = 'customer3@test.com'
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO portfolios (customer_id, performer_id, owner_type, name, phone, email, town_country, specializations, employment, experience, description, scope_s, is_active) 
SELECT c.id, NULL, 'CUSTOMER', 'Козлова Елена Дмитриевна', '+7 (999) 456-78-90', 'customer4@test.com', 'Новосибирск, Россия', NULL, NULL, NULL, 'Заказчик в сфере образования. Ищу разработчиков для образовательных платформ.', 'Образование, IT и технологии', true 
FROM customers c JOIN accounts a ON c.account_id = a.id WHERE a.email = 'customer4@test.com'
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Портфолио исполнителей
INSERT INTO portfolios (customer_id, performer_id, owner_type, name, phone, email, town_country, specializations, employment, experience, description, scope_s, is_active) 
SELECT NULL, p.id, 'PERFORMER', 'Смирнов Дмитрий Александрович', '+7 (999) 567-89-01', 'performer1@test.com', 'Москва, Россия', 'Full-stack разработка, Веб-разработка, Backend разработка', 'Опыт работы: 5 лет', 'Разрабатываю веб-приложения на Java, Spring Boot, React, Node.js. Имею опыт работы с микросервисной архитектурой.', NULL, true 
FROM performers p JOIN accounts a ON p.account_id = a.id WHERE a.email = 'performer1@test.com'
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO portfolios (customer_id, performer_id, owner_type, name, phone, email, town_country, specializations, employment, experience, description, scope_s, is_active) 
SELECT NULL, p.id, 'PERFORMER', 'Волкова Анна Петровна', '+7 (999) 678-90-12', 'performer2@test.com', 'Санкт-Петербург, Россия', 'UI/UX дизайн, Графический дизайн, Веб-дизайн', 'Опыт работы: 7 лет', 'Создаю современные и удобные интерфейсы. Работаю в Figma, Adobe XD, Sketch.', NULL, true 
FROM performers p JOIN accounts a ON p.account_id = a.id WHERE a.email = 'performer2@test.com'
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO portfolios (customer_id, performer_id, owner_type, name, phone, email, town_country, specializations, employment, experience, description, scope_s, is_active) 
SELECT NULL, p.id, 'PERFORMER', 'Лебедев Сергей Игоревич', '+7 (999) 789-01-23', 'performer3@test.com', 'Казань, Россия', 'Frontend разработка, React, Vue.js, TypeScript', 'Опыт работы: 3 года', 'Специализируюсь на создании интерактивных веб-приложений. Знаю React, Vue.js, TypeScript, Redux.', NULL, true 
FROM performers p JOIN accounts a ON p.account_id = a.id WHERE a.email = 'performer3@test.com'
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO portfolios (customer_id, performer_id, owner_type, name, phone, email, town_country, specializations, employment, experience, description, scope_s, is_active) 
SELECT NULL, p.id, 'PERFORMER', 'Новикова Ольга Викторовна', '+7 (999) 890-12-34', 'performer4@test.com', 'Ростов-на-Дону, Россия', 'Маркетинг, SMM, Контент-маркетинг', 'Опыт работы: 6 лет', 'Помогаю бизнесу продвигать свои продукты через социальные сети и контент-маркетинг.', NULL, true 
FROM performers p JOIN accounts a ON p.account_id = a.id WHERE a.email = 'performer4@test.com'
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO portfolios (customer_id, performer_id, owner_type, name, phone, email, town_country, specializations, employment, experience, description, scope_s, is_active) 
SELECT NULL, p.id, 'PERFORMER', 'Морозов Андрей Николаевич', '+7 (999) 901-23-45', 'performer5@test.com', 'Краснодар, Россия', 'Backend разработка, Python, Django, PostgreSQL', 'Опыт работы: 8 лет', 'Разрабатываю серверную часть приложений. Специализируюсь на Python, Django, FastAPI, PostgreSQL.', NULL, true 
FROM performers p JOIN accounts a ON p.account_id = a.id WHERE a.email = 'performer5@test.com'
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ============================================
-- КОНЕЦ МИГРАЦИИ
-- ============================================