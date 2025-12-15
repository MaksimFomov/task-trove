-- V15: Очистка всех данных кроме супер админа и заполнение тестовыми данными
-- Удаляет все данные, кроме аккаунта супер админа (логин "admin" с ролью SuperAdministrator)
-- Затем заполняет базу тестовыми данными для тестирования приложения

-- BCrypt хеш для пароля "password" (используется для всех тестовых пользователей)
-- Все тестовые пользователи имеют пароль: password
SET @test_password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

-- Получаем ID роли SuperAdministrator
SET @super_admin_role_id = (SELECT id FROM roles WHERE name = 'SuperAdministrator' LIMIT 1);

-- Получаем ID аккаунта супер админа (если существует)
SET @super_admin_account_id = (SELECT id FROM accounts WHERE login = 'admin' AND role_id = @super_admin_role_id LIMIT 1);

-- Отключаем проверку внешних ключей для безопасного удаления
SET FOREIGN_KEY_CHECKS = 0;

-- Удаляем сообщения
DELETE FROM messages;

-- Удаляем чаты
DELETE FROM chats;

-- Удаляем уведомления
DELETE FROM notifications;

-- Удаляем отклики
DELETE FROM replies;

-- Удаляем заказы
DELETE FROM orders;

-- Удаляем портфолио
DELETE FROM portfolios;

-- Удаляем опыт работы
DELETE FROM work_experiences;

-- Удаляем всех исполнителей, кроме связанных с супер админом (если супер админ существует)
DELETE FROM performers WHERE @super_admin_account_id IS NULL OR account_id != @super_admin_account_id;

-- Удаляем всех заказчиков, кроме связанных с супер админом (если супер админ существует)
DELETE FROM customers WHERE @super_admin_account_id IS NULL OR account_id != @super_admin_account_id;

-- Удаляем всех администраторов, кроме связанных с супер админом (если супер админ существует)
DELETE FROM administrators WHERE @super_admin_account_id IS NULL OR account_id != @super_admin_account_id;

-- Удаляем все аккаунты, кроме супер админа
DELETE FROM accounts WHERE @super_admin_account_id IS NULL OR id != @super_admin_account_id;

-- Включаем обратно проверку внешних ключей
SET FOREIGN_KEY_CHECKS = 1;

-- Сбрасываем AUTO_INCREMENT для всех очищенных таблиц
ALTER TABLE messages AUTO_INCREMENT = 1;
ALTER TABLE chats AUTO_INCREMENT = 1;
ALTER TABLE notifications AUTO_INCREMENT = 1;
ALTER TABLE replies AUTO_INCREMENT = 1;
ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE portfolios AUTO_INCREMENT = 1;
ALTER TABLE work_experiences AUTO_INCREMENT = 1;
ALTER TABLE performers AUTO_INCREMENT = 1;
ALTER TABLE customers AUTO_INCREMENT = 1;
ALTER TABLE administrators AUTO_INCREMENT = 1;
ALTER TABLE accounts AUTO_INCREMENT = 1;

-- Получаем ID ролей
SET @role_customer_id = (SELECT id FROM roles WHERE name = 'Customer' LIMIT 1);
SET @role_performer_id = (SELECT id FROM roles WHERE name = 'Performer' LIMIT 1);

-- ============================================
-- СОЗДАНИЕ ТЕСТОВЫХ ЗАКАЗЧИКОВ (CUSTOMERS)
-- ============================================

-- Заказчик 1: Иван Петров
INSERT INTO accounts (login, email, password, is_active, role_id) VALUES
('customer1', 'ivan.petrov@example.com', @test_password_hash, 1, @role_customer_id);
SET @customer1_account_id = LAST_INSERT_ID();
INSERT INTO customers (account_id, last_name, first_name, middle_name, phone, description, scope_s) VALUES
(@customer1_account_id, 'Петров', 'Иван', 'Сергеевич', '+7 (999) 123-45-67', 'Опытный заказчик, работаю в IT-сфере более 10 лет', 'Разработка веб-приложений');

-- Заказчик 2: Мария Сидорова
INSERT INTO accounts (login, email, password, is_active, role_id) VALUES
('customer2', 'maria.sidorova@example.com', @test_password_hash, 1, @role_customer_id);
SET @customer2_account_id = LAST_INSERT_ID();
INSERT INTO customers (account_id, last_name, first_name, middle_name, phone, description, scope_s) VALUES
(@customer2_account_id, 'Сидорова', 'Мария', 'Александровна', '+7 (999) 234-56-78', 'Предприниматель, нуждаюсь в качественной разработке', 'Мобильная разработка');

-- Заказчик 3: Алексей Козлов
INSERT INTO accounts (login, email, password, is_active, role_id) VALUES
('customer3', 'alexey.kozlov@example.com', @test_password_hash, 1, @role_customer_id);
SET @customer3_account_id = LAST_INSERT_ID();
INSERT INTO customers (account_id, last_name, first_name, middle_name, phone, description, scope_s) VALUES
(@customer3_account_id, 'Козлов', 'Алексей', 'Владимирович', '+7 (999) 345-67-89', 'Стартап в области e-commerce', 'E-commerce разработка');

-- Получаем ID заказчиков
SET @customer1_id = (SELECT id FROM customers WHERE account_id = @customer1_account_id);
SET @customer2_id = (SELECT id FROM customers WHERE account_id = @customer2_account_id);
SET @customer3_id = (SELECT id FROM customers WHERE account_id = @customer3_account_id);

-- ============================================
-- СОЗДАНИЕ ТЕСТОВЫХ ИСПОЛНИТЕЛЕЙ (PERFORMERS)
-- ============================================

-- Исполнитель 1: Дмитрий Смирнов
INSERT INTO accounts (login, email, password, is_active, role_id) VALUES
('performer1', 'dmitry.smirnov@example.com', @test_password_hash, 1, @role_performer_id);
SET @performer1_account_id = LAST_INSERT_ID();
INSERT INTO performers (account_id, age, last_name, first_name, middle_name, rating) VALUES
(@performer1_account_id, 28, 'Смирнов', 'Дмитрий', 'Игоревич', 5);

-- Исполнитель 2: Анна Волкова
INSERT INTO accounts (login, email, password, is_active, role_id) VALUES
('performer2', 'anna.volkova@example.com', @test_password_hash, 1, @role_performer_id);
SET @performer2_account_id = LAST_INSERT_ID();
INSERT INTO performers (account_id, age, last_name, first_name, middle_name, rating) VALUES
(@performer2_account_id, 25, 'Волкова', 'Анна', 'Дмитриевна', 4);

-- Исполнитель 3: Сергей Новиков
INSERT INTO accounts (login, email, password, is_active, role_id) VALUES
('performer3', 'sergey.novikov@example.com', @test_password_hash, 1, @role_performer_id);
SET @performer3_account_id = LAST_INSERT_ID();
INSERT INTO performers (account_id, age, last_name, first_name, middle_name, rating) VALUES
(@performer3_account_id, 32, 'Новиков', 'Сергей', 'Петрович', 5);

-- Исполнитель 4: Елена Морозова
INSERT INTO accounts (login, email, password, is_active, role_id) VALUES
('performer4', 'elena.morozova@example.com', @test_password_hash, 1, @role_performer_id);
SET @performer4_account_id = LAST_INSERT_ID();
INSERT INTO performers (account_id, age, last_name, first_name, middle_name, rating) VALUES
(@performer4_account_id, 27, 'Морозова', 'Елена', 'Сергеевна', 4);

-- Получаем ID исполнителей
SET @performer1_id = (SELECT id FROM performers WHERE account_id = @performer1_account_id);
SET @performer2_id = (SELECT id FROM performers WHERE account_id = @performer2_account_id);
SET @performer3_id = (SELECT id FROM performers WHERE account_id = @performer3_account_id);
SET @performer4_id = (SELECT id FROM performers WHERE account_id = @performer4_account_id);

-- ============================================
-- СОЗДАНИЕ ПОРТФОЛИО ДЛЯ ИСПОЛНИТЕЛЕЙ
-- ============================================

-- Портфолио для исполнителя 1
INSERT INTO portfolios (performer_id, name, phone, email, town_country, specializations, employment, experience, is_active) VALUES
(@performer1_id, 'Full Stack Developer', '+7 (999) 111-22-33', 'dmitry.smirnov@example.com', 'Москва, Россия', 
 'Java, Spring Boot, React, PostgreSQL', 'Удаленно', 'Опыт работы более 5 лет в разработке веб-приложений', 1);

-- Портфолио для исполнителя 2
INSERT INTO portfolios (performer_id, name, phone, email, town_country, specializations, employment, experience, is_active) VALUES
(@performer2_id, 'Frontend Developer', '+7 (999) 222-33-44', 'anna.volkova@example.com', 'Санкт-Петербург, Россия',
 'React, TypeScript, Vue.js, CSS', 'Удаленно', 'Специализируюсь на создании современных пользовательских интерфейсов', 1);

-- Портфолио для исполнителя 3
INSERT INTO portfolios (performer_id, name, phone, email, town_country, specializations, employment, experience, is_active) VALUES
(@performer3_id, 'Backend Developer', '+7 (999) 333-44-55', 'sergey.novikov@example.com', 'Новосибирск, Россия',
 'Java, Spring, Microservices, Docker', 'Удаленно', 'Более 8 лет опыта в разработке серверных приложений', 1);

-- Портфолио для исполнителя 4
INSERT INTO portfolios (performer_id, name, phone, email, town_country, specializations, employment, experience, is_active) VALUES
(@performer4_id, 'Mobile Developer', '+7 (999) 444-55-66', 'elena.morozova@example.com', 'Екатеринбург, Россия',
 'React Native, Flutter, iOS, Android', 'Удаленно', 'Разработка мобильных приложений для iOS и Android', 1);

-- ============================================
-- СОЗДАНИЕ ТЕСТОВЫХ ЗАКАЗОВ (ORDERS)
-- ============================================

-- Заказ 1: Разработка веб-приложения
INSERT INTO orders (title, scope, stack_s, description, customer_id, performer_id, is_actived, is_in_process, is_on_check, is_done, is_deleted_by_customer, publication_time, start_time, reply_bind) VALUES
('Разработка интернет-магазина', 'Разработка веб-приложений', 'Java, Spring Boot, React, PostgreSQL',
 'Необходимо разработать полнофункциональный интернет-магазин с корзиной, оплатой и админ-панелью', 
 @customer1_id, NULL, 1, 0, 0, 0, 0, NOW(), NULL, 0);

SET @order1_id = LAST_INSERT_ID();

-- Заказ 2: Мобильное приложение
INSERT INTO orders (title, scope, stack_s, description, customer_id, performer_id, is_actived, is_in_process, is_on_check, is_done, is_deleted_by_customer, publication_time, start_time, reply_bind) VALUES
('Разработка мобильного приложения для доставки', 'Мобильная разработка', 'React Native, Node.js, MongoDB',
 'Требуется создать мобильное приложение для iOS и Android с функциями заказа, отслеживания и оплаты', 
 @customer2_id, NULL, 1, 0, 0, 0, 0, DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, 0);

SET @order2_id = LAST_INSERT_ID();

-- Заказ 3: В процессе выполнения
INSERT INTO orders (title, scope, stack_s, description, customer_id, performer_id, is_actived, is_in_process, is_on_check, is_done, is_deleted_by_customer, publication_time, start_time, reply_bind) VALUES
('Создание корпоративного портала', 'Разработка веб-приложений', 'Java, Spring, Angular, MySQL',
 'Разработка внутреннего портала для сотрудников компании с системой документооборота', 
 @customer3_id, @performer1_id, 1, 1, 0, 0, 0, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), 0);

SET @order3_id = LAST_INSERT_ID();

-- Заказ 4: На проверке
INSERT INTO orders (title, scope, stack_s, description, customer_id, performer_id, is_actived, is_in_process, is_on_check, is_done, is_deleted_by_customer, publication_time, start_time, reply_bind) VALUES
('Разработка API для интеграции', 'Разработка веб-приложений', 'Node.js, Express, MongoDB',
 'Создание REST API для интеграции с внешними сервисами платежей и доставки', 
 @customer1_id, @performer3_id, 1, 0, 1, 0, 0, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), 0);

SET @order4_id = LAST_INSERT_ID();

-- Заказ 5: Выполнен
INSERT INTO orders (title, scope, stack_s, description, customer_id, performer_id, is_actived, is_in_process, is_on_check, is_done, is_deleted_by_customer, publication_time, start_time, end_time, reply_bind) VALUES
('Верстка лендинга', 'Разработка веб-приложений', 'HTML, CSS, JavaScript',
 'Адаптивная верстка лендинга для нового продукта компании', 
 @customer2_id, @performer2_id, 1, 0, 0, 1, 0, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 0);

SET @order5_id = LAST_INSERT_ID();

-- ============================================
-- СОЗДАНИЕ ОТКЛИКОВ (REPLIES)
-- ============================================

-- Отклики на заказ 1
INSERT INTO replies (order_id, performer_id, is_done_this_task, is_on_customer, donned) VALUES
(@order1_id, @performer1_id, 0, 0, 0),
(@order1_id, @performer3_id, 0, 0, 0);

-- Отклики на заказ 2
INSERT INTO replies (order_id, performer_id, is_done_this_task, is_on_customer, donned) VALUES
(@order2_id, @performer4_id, 0, 0, 0),
(@order2_id, @performer2_id, 0, 0, 0);

-- ============================================
-- СОЗДАНИЕ ОПЫТА РАБОТЫ (WORK_EXPERIENCES)
-- ============================================

-- Отзывы о выполненном заказе 5
INSERT INTO work_experiences (name, rate, text, reviewer_type, order_id, customer_id, performer_id, created_at) VALUES
('Отличная работа!', 5, 'Елена выполнила работу качественно и в срок. Очень доволен результатом!', 'CUSTOMER', @order5_id, @customer2_id, @performer2_id, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('Приятное сотрудничество', 5, 'Заказчик был очень внимателен к деталям и быстро давал обратную связь. Рекомендую!', 'PERFORMER', @order5_id, @customer2_id, @performer2_id, DATE_SUB(NOW(), INTERVAL 1 DAY));

-- ============================================
-- СОЗДАНИЕ ЧАТОВ (CHATS)
-- ============================================

-- Чат для заказа 3
INSERT INTO chats (customer_id, performer_id, room_name, last_message_time, check_by_customer, check_by_performer) VALUES
(@customer3_id, @performer1_id, CONCAT('chat_', @customer3_id, '_', @performer1_id, '_', @order3_id), DATE_SUB(NOW(), INTERVAL 1 HOUR), 1, 0);

SET @chat1_id = LAST_INSERT_ID();

-- Чат для заказа 4
INSERT INTO chats (customer_id, performer_id, room_name, last_message_time, check_by_customer, check_by_performer) VALUES
(@customer1_id, @performer3_id, CONCAT('chat_', @customer1_id, '_', @performer3_id, '_', @order4_id), DATE_SUB(NOW(), INTERVAL 2 HOUR), 0, 1);

SET @chat2_id = LAST_INSERT_ID();

-- ============================================
-- СОЗДАНИЕ СООБЩЕНИЙ (MESSAGES)
-- ============================================

-- Сообщения в чате 1
INSERT INTO messages (text, chat_id, sender_id, sender_type, created) VALUES
('Здравствуйте! Начал работу над проектом', @chat1_id, @performer1_account_id, 'Performer', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('Отлично, жду результатов', @chat1_id, @customer3_account_id, 'Customer', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('Есть вопросы по требованиям, могу уточнить?', @chat1_id, @performer1_account_id, 'Performer', DATE_SUB(NOW(), INTERVAL 1 HOUR));

-- Сообщения в чате 2
INSERT INTO messages (text, chat_id, sender_id, sender_type, created) VALUES
('Проект готов к проверке', @chat2_id, @performer3_account_id, 'Performer', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('Спасибо, проверю в ближайшее время', @chat2_id, @customer1_account_id, 'Customer', DATE_SUB(NOW(), INTERVAL 2 HOUR));

-- ============================================
-- СОЗДАНИЕ УВЕДОМЛЕНИЙ (NOTIFICATIONS)
-- ============================================

-- Уведомления для заказчика 1
INSERT INTO notifications (account_id, user_role, type, title, message, is_read, created_at, related_order_id, related_performer_id) VALUES
(@customer1_account_id, 'Customer', 'REPLY', 'Новый отклик на заказ', 'Исполнитель оставил отклик на ваш заказ "Разработка интернет-магазина"', 0, DATE_SUB(NOW(), INTERVAL 1 DAY), @order1_id, @performer1_id),
(@customer1_account_id, 'Customer', 'ASSIGNED', 'Исполнитель назначен', 'Исполнитель назначен на заказ "Разработка API для интеграции"', 1, DATE_SUB(NOW(), INTERVAL 7 DAY), @order4_id, @performer3_id);

-- Уведомления для исполнителя 1
INSERT INTO notifications (account_id, user_role, type, title, message, is_read, created_at, related_order_id, related_customer_id) VALUES
(@performer1_account_id, 'Performer', 'ASSIGNED', 'Вы назначены исполнителем', 'Вы назначены исполнителем на заказ "Создание корпоративного портала"', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), @order3_id, @customer3_id),
(@performer1_account_id, 'Performer', 'MESSAGE', 'Новое сообщение', 'Новое сообщение в чате по заказу "Создание корпоративного портала"', 0, DATE_SUB(NOW(), INTERVAL 1 HOUR), @order3_id, @customer3_id);

-- Уведомления для исполнителя 2
INSERT INTO notifications (account_id, user_role, type, title, message, is_read, created_at, related_order_id, related_customer_id) VALUES
(@performer2_account_id, 'Performer', 'COMPLETED', 'Заказ выполнен', 'Заказ "Верстка лендинга" успешно выполнен и принят заказчиком', 1, DATE_SUB(NOW(), INTERVAL 1 DAY), @order5_id, @customer2_id);

