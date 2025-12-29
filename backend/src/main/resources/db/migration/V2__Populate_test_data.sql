-- V2: Наполнение базы данных тестовыми данными
-- Эта миграция создает тестовые данные для всех моделей с учетом всех возможных вариантов использования на фронте

-- Пароли для всех тестовых пользователей: "password123"
-- BCrypt hash для "password123": $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

-- ============================================
-- 1. ДОПОЛНИТЕЛЬНЫЕ АККАУНТЫ (роли уже созданы в V1)
-- ============================================

-- Заказчики
INSERT IGNORE INTO accounts (id, email, password, is_active, role_id) VALUES
(2, 'customer1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 3),
(3, 'customer2@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 3),
(4, 'customer3@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 3),
(5, 'customer4@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 3);

-- Исполнители
INSERT IGNORE INTO accounts (id, email, password, is_active, role_id) VALUES
(6, 'performer1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 4),
(7, 'performer2@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 4),
(8, 'performer3@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 4),
(9, 'performer4@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 4),
(10, 'performer5@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 4);

-- Администраторы
INSERT IGNORE INTO accounts (id, email, password, is_active, role_id) VALUES
(11, 'admin1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 2),
(12, 'admin2@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 2);

-- ============================================
-- 2. ЗАКАЗЧИКИ (CUSTOMERS)
-- ============================================

INSERT IGNORE INTO customers (id, account_id, last_name, first_name, middle_name) VALUES
(1, 2, 'Иванов', 'Иван', 'Иванович'),
(2, 3, 'Петрова', 'Мария', 'Сергеевна'),
(3, 4, 'Сидоров', 'Алексей', 'Владимирович'),
(4, 5, 'Козлова', 'Елена', 'Дмитриевна');

-- ============================================
-- 3. ИСПОЛНИТЕЛИ (PERFORMERS)
-- ============================================

INSERT IGNORE INTO performers (id, account_id, last_name, first_name, middle_name, age, rating) VALUES
(1, 6, 'Смирнов', 'Дмитрий', 'Александрович', 28, 5),
(2, 7, 'Волкова', 'Анна', 'Петровна', 32, 4),
(3, 8, 'Лебедев', 'Сергей', 'Игоревич', 25, 5),
(4, 9, 'Новикова', 'Ольга', 'Викторовна', 29, 4),
(5, 10, 'Морозов', 'Андрей', 'Николаевич', 35, 5);

-- ============================================
-- 4. АДМИНИСТРАТОРЫ (ADMINISTRATORS)
-- ============================================

INSERT IGNORE INTO administrators (id, account_id, name) VALUES
(2, 11, 'Администратор 1'),
(3, 12, 'Администратор 2');

-- ============================================
-- 5. ПОРТФОЛИО (PORTFOLIOS)
-- ============================================

-- Портфолио заказчиков
INSERT IGNORE INTO portfolios (id, customer_id, performer_id, owner_type, name, phone, email, town_country, specializations, employment, experience, description, scope_s, is_active) VALUES
(1, 1, NULL, 'CUSTOMER', 'Иванов Иван Иванович', '+7 (999) 123-45-67', 'customer1@test.com', 'Москва, Россия', NULL, NULL, NULL, 'Опытный заказчик в сфере IT и разработки. Ищу качественных исполнителей для реализации проектов.', 'IT и технологии, Маркетинг и реклама', true),
(2, 2, NULL, 'CUSTOMER', 'Петрова Мария Сергеевна', '+7 (999) 234-56-78', 'customer2@test.com', 'Санкт-Петербург, Россия', NULL, NULL, NULL, 'Заказчик с опытом работы в дизайне и маркетинге. Требую высокого качества исполнения.', 'Дизайн и творчество, Маркетинг и реклама', true),
(3, 3, NULL, 'CUSTOMER', 'Сидоров Алексей Владимирович', '+7 (999) 345-67-89', 'customer3@test.com', 'Екатеринбург, Россия', NULL, NULL, NULL, 'Предприниматель, нуждаюсь в IT-решениях для бизнеса.', 'IT и технологии, Финансы, Консалтинг', true),
(4, 4, NULL, 'CUSTOMER', 'Козлова Елена Дмитриевна', '+7 (999) 456-78-90', 'customer4@test.com', 'Новосибирск, Россия', NULL, NULL, NULL, 'Заказчик в сфере образования. Ищу разработчиков для образовательных платформ.', 'Образование, IT и технологии', true);

-- Портфолио исполнителей
INSERT IGNORE INTO portfolios (id, customer_id, performer_id, owner_type, name, phone, email, town_country, specializations, employment, experience, description, scope_s, is_active) VALUES
(5, NULL, 1, 'PERFORMER', 'Смирнов Дмитрий Александрович', '+7 (999) 567-89-01', 'performer1@test.com', 'Москва, Россия', 'Full-stack разработка, Веб-разработка, Backend разработка', 'Опыт работы: 5 лет', 'Разрабатываю веб-приложения на Java, Spring Boot, React, Node.js. Имею опыт работы с микросервисной архитектурой.', NULL, true),
(6, NULL, 2, 'PERFORMER', 'Волкова Анна Петровна', '+7 (999) 678-90-12', 'performer2@test.com', 'Санкт-Петербург, Россия', 'UI/UX дизайн, Графический дизайн, Веб-дизайн', 'Опыт работы: 7 лет', 'Создаю современные и удобные интерфейсы. Работаю в Figma, Adobe XD, Sketch.', NULL, true),
(7, NULL, 3, 'PERFORMER', 'Лебедев Сергей Игоревич', '+7 (999) 789-01-23', 'performer3@test.com', 'Казань, Россия', 'Frontend разработка, React, Vue.js, TypeScript', 'Опыт работы: 3 года', 'Специализируюсь на создании интерактивных веб-приложений. Знаю React, Vue.js, TypeScript, Redux.', NULL, true),
(8, NULL, 4, 'PERFORMER', 'Новикова Ольга Викторовна', '+7 (999) 890-12-34', 'performer4@test.com', 'Ростов-на-Дону, Россия', 'Маркетинг, SMM, Контент-маркетинг', 'Опыт работы: 6 лет', 'Помогаю бизнесу продвигать свои продукты через социальные сети и контент-маркетинг.', NULL, true),
(9, NULL, 5, 'PERFORMER', 'Морозов Андрей Николаевич', '+7 (999) 901-23-45', 'performer5@test.com', 'Краснодар, Россия', 'Backend разработка, Python, Django, PostgreSQL', 'Опыт работы: 8 лет', 'Разрабатываю серверную часть приложений. Специализируюсь на Python, Django, FastAPI, PostgreSQL.', NULL, true);

-- ============================================
-- 6. ЗАКАЗЫ (ORDERS) - Разные статусы и варианты
-- ============================================

-- ACTIVE заказы (без исполнителя, доступны для откликов)
INSERT IGNORE INTO orders (id, title, scope, stack_s, description, customer_id, performer_id, status, is_deleted_by_customer, publication_time, start_time, end_time, budget, is_spec_sent, reply_bind) VALUES
(1, 'Разработка веб-приложения для управления задачами', 'IT и технологии', 'React, TypeScript, Node.js, PostgreSQL', 'Нужно разработать современное веб-приложение для управления задачами с возможностью создания проектов, назначения исполнителей и отслеживания прогресса. Требуется адаптивный дизайн и интеграция с API.', 1, NULL, 'ACTIVE', false, NOW() - INTERVAL 5 DAY, NULL, NULL, 150000.00, false, 0),
(2, 'Создание логотипа и фирменного стиля', 'Дизайн и творчество', 'Adobe Illustrator, Photoshop', 'Требуется разработать логотип и фирменный стиль для стартапа в сфере технологий. Нужен современный, запоминающийся дизайн.', 2, NULL, 'ACTIVE', false, NOW() - INTERVAL 3 DAY, NULL, NULL, 50000.00, false, 0),
(3, 'Разработка мобильного приложения', 'IT и технологии', 'React Native, Firebase, TypeScript', 'Необходимо создать мобильное приложение для iOS и Android с синхронизацией данных в реальном времени. Требуется интеграция с платежными системами.', 3, NULL, 'ACTIVE', false, NOW() - INTERVAL 1 DAY, NULL, NULL, 300000.00, false, 0),
(4, 'Настройка маркетинговой кампании в соцсетях', 'Маркетинг и реклама', 'Facebook Ads, Instagram Ads, Google Analytics', 'Нужно запустить и настроить рекламную кампанию в социальных сетях для продвижения нового продукта. Требуется анализ целевой аудитории и создание креативов.', 4, NULL, 'ACTIVE', false, NOW() - INTERVAL 2 DAY, NULL, NULL, 80000.00, false, 0);

-- IN_PROCESS заказы (с назначенным исполнителем, в работе)
INSERT IGNORE INTO orders (id, title, scope, stack_s, description, customer_id, performer_id, status, is_deleted_by_customer, publication_time, start_time, end_time, budget, is_spec_sent, reply_bind) VALUES
(5, 'Разработка API для интеграции с внешними сервисами', 'IT и технологии', 'Java, Spring Boot, REST API, MySQL', 'Требуется разработать REST API для интеграции с различными внешними сервисами. Нужна документация и тестирование.', 1, 1, 'IN_PROCESS', false, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 8 DAY, NULL, 120000.00, true, 1),
(6, 'Дизайн интерфейса мобильного приложения', 'Дизайн и творчество', 'Figma, Adobe XD', 'Нужен дизайн интерфейса для мобильного приложения с учетом UX/UI принципов. Требуется создание прототипов и макетов.', 2, 2, 'IN_PROCESS', false, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 5 DAY, NULL, 70000.00, true, 1);

-- ON_CHECK заказы (на проверке)
INSERT IGNORE INTO orders (id, title, scope, stack_s, description, customer_id, performer_id, status, is_deleted_by_customer, publication_time, start_time, end_time, budget, is_spec_sent, reply_bind) VALUES
(7, 'Создание лендинга для продукта', 'IT и технологии, Маркетинг и реклама', 'HTML, CSS, JavaScript, WordPress', 'Требуется создать одностраничный лендинг для нового продукта с формой обратной связи и интеграцией аналитики.', 3, 3, 'ON_CHECK', false, NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 12 DAY, NULL, 60000.00, true, 1);

-- ON_REVIEW заказы (на рассмотрении администратором)
INSERT IGNORE INTO orders (id, title, scope, stack_s, description, customer_id, performer_id, status, is_deleted_by_customer, publication_time, start_time, end_time, budget, is_spec_sent, reply_bind) VALUES
(8, 'Разработка системы аналитики', 'IT и технологии, Финансы', 'Python, Django, PostgreSQL, Redis', 'Нужна система для сбора и анализа данных с визуализацией результатов. Требуется интеграция с различными источниками данных.', 4, NULL, 'ON_REVIEW', false, NOW() - INTERVAL 1 HOUR, NULL, NULL, 200000.00, false, 0);

-- DONE заказы (выполненные)
INSERT IGNORE INTO orders (id, title, scope, stack_s, description, customer_id, performer_id, status, is_deleted_by_customer, publication_time, start_time, end_time, budget, is_spec_sent, reply_bind) VALUES
(9, 'Разработка корпоративного сайта', 'IT и технологии', 'React, Next.js, TypeScript, Tailwind CSS', 'Создан современный корпоративный сайт с админ-панелью и системой управления контентом.', 1, 1, 'DONE', false, NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 28 DAY, NOW() - INTERVAL 2 DAY, 180000.00, true, 1),
(10, 'Брендинг и айдентика компании', 'Дизайн и творчество', 'Adobe Illustrator, Photoshop, InDesign', 'Разработан полный брендбук компании, включая логотип, цветовую палитру, типографику и примеры применения.', 2, 2, 'DONE', false, NOW() - INTERVAL 25 DAY, NOW() - INTERVAL 23 DAY, NOW() - INTERVAL 1 DAY, 90000.00, true, 1),
(11, 'Разработка интернет-магазина', 'IT и технологии, Торговля', 'Vue.js, Node.js, MongoDB, Stripe', 'Создан полнофункциональный интернет-магазин с корзиной, оплатой и системой управления заказами.', 3, 5, 'DONE', false, NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 18 DAY, NOW() - INTERVAL 3 DAY, 250000.00, true, 1);

-- REJECTED заказы (отклоненные)
INSERT IGNORE INTO orders (id, title, scope, stack_s, description, customer_id, performer_id, status, is_deleted_by_customer, publication_time, start_time, end_time, budget, is_spec_sent, reply_bind) VALUES
(12, 'Разработка игры на Unity', 'IT и технологии', 'Unity, C#, Blender', 'Требуется разработать мобильную игру с 3D графикой. Проект был отклонен из-за несоответствия требованиям.', 4, NULL, 'REJECTED', false, NOW() - INTERVAL 12 DAY, NULL, NULL, 500000.00, false, 0);

-- Заказ с удалением заказчиком (мягкое удаление)
INSERT IGNORE INTO orders (id, title, scope, stack_s, description, customer_id, performer_id, status, is_deleted_by_customer, publication_time, start_time, end_time, budget, is_spec_sent, reply_bind) VALUES
(13, 'Удаленный заказ заказчиком', 'IT и технологии', 'PHP, Laravel, MySQL', 'Этот заказ был удален заказчиком, но остается видимым для исполнителя.', 1, NULL, 'ACTIVE', true, NOW() - INTERVAL 4 DAY, NULL, NULL, 100000.00, false, 0);

-- ============================================
-- 7. ОТКЛИКИ (REPLIES)
-- ============================================

-- Отклики на ACTIVE заказы
INSERT IGNORE INTO replies (id, order_id, performer_id, is_approved_by_customer) VALUES
(1, 1, 1, false),  -- Отклик от performer1 на заказ 1
(2, 1, 3, false),  -- Отклик от performer3 на заказ 1
(3, 1, 5, false),  -- Отклик от performer5 на заказ 1
(4, 2, 2, false),  -- Отклик от performer2 на заказ 2
(5, 2, 4, false),  -- Отклик от performer4 на заказ 2
(6, 3, 1, false),  -- Отклик от performer1 на заказ 3
(7, 3, 3, false),  -- Отклик от performer3 на заказ 3
(8, 4, 4, false),  -- Отклик от performer4 на заказ 4

-- Одобренные отклики (для заказов в работе)
(9, 5, 1, true),   -- Одобренный отклик для заказа 5
(10, 6, 2, true),  -- Одобренный отклик для заказа 6
(11, 7, 3, true),  -- Одобренный отклик для заказа 7
(12, 9, 1, true),  -- Одобренный отклик для выполненного заказа 9
(13, 10, 2, true), -- Одобренный отклик для выполненного заказа 10
(14, 11, 5, true); -- Одобренный отклик для выполненного заказа 11

-- Обновляем reply_bind для заказов с одобренными откликами
UPDATE orders SET reply_bind = 1 WHERE id IN (5, 6, 7, 9, 10, 11);

-- ============================================
-- 8. ЧАТЫ (CHATS)
-- ============================================

INSERT IGNORE INTO chats (id, customer_id, performer_id, room_name, last_message_time, check_by_customer, check_by_performer, last_checked_by_customer_time, last_checked_by_performer_time, deleted_by_customer, deleted_by_performer) VALUES
(1, 1, 1, 'customer1-performer1', NOW() - INTERVAL 1 HOUR, true, false, NOW() - INTERVAL 30 MINUTE, NULL, false, false),
(2, 2, 2, 'customer2-performer2', NOW() - INTERVAL 2 HOUR, false, true, NULL, NOW() - INTERVAL 1 HOUR, false, false),
(3, 1, 3, 'customer1-performer3', NOW() - INTERVAL 3 HOUR, true, true, NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 1 HOUR, false, false),
(4, 3, 5, 'customer3-performer5', NOW() - INTERVAL 30 MINUTE, false, false, NULL, NULL, false, false),
(5, 2, 4, 'customer2-performer4', NOW() - INTERVAL 4 HOUR, true, false, NOW() - INTERVAL 3 HOUR, NULL, false, false);

-- ============================================
-- 9. СООБЩЕНИЯ (MESSAGES)
-- ============================================

-- Сообщения в чате 1 (customer1 - performer1)
INSERT IGNORE INTO messages (id, text, chat_id, sender_id, sender_type, created) VALUES
(1, 'Здравствуйте! Интересует ваш отклик на заказ по разработке API.', 1, 2, 'Customer', NOW() - INTERVAL 2 HOUR),
(2, 'Добрый день! Готов обсудить детали проекта. Какие требования к API?', 1, 6, 'Performer', NOW() - INTERVAL 1 HOUR 50 MINUTE),
(3, 'Нужна поддержка REST и GraphQL, интеграция с MySQL и Redis.', 1, 2, 'Customer', NOW() - INTERVAL 1 HOUR 40 MINUTE),
(4, 'Отлично, это в моей компетенции. Могу начать работу на следующей неделе.', 1, 6, 'Performer', NOW() - INTERVAL 1 HOUR 30 MINUTE),
(5, 'Хорошо, тогда жду вашего подтверждения.', 1, 2, 'Customer', NOW() - INTERVAL 1 HOUR);

-- Сообщения в чате 2 (customer2 - performer2)
INSERT IGNORE INTO messages (id, text, chat_id, sender_id, sender_type, created) VALUES
(6, 'Привет! Посмотрел ваше портфолио, очень понравились работы. Хочу обсудить дизайн интерфейса.', 2, 3, 'Customer', NOW() - INTERVAL 3 HOUR),
(7, 'Спасибо! С удовольствием помогу с дизайном. Какой стиль вы предпочитаете?', 2, 7, 'Performer', NOW() - INTERVAL 2 HOUR 50 MINUTE),
(8, 'Хотелось бы современный минималистичный дизайн в светлых тонах.', 2, 3, 'Customer', NOW() - INTERVAL 2 HOUR 30 MINUTE),
(9, 'Понял, подготовлю несколько вариантов концепции.', 2, 7, 'Performer', NOW() - INTERVAL 2 HOUR);

-- Сообщения в чате 3 (customer1 - performer3)
INSERT IGNORE INTO messages (id, text, chat_id, sender_id, sender_type, created) VALUES
(10, 'Здравствуйте! Есть вопросы по проекту лендинга.', 3, 2, 'Customer', NOW() - INTERVAL 4 HOUR),
(11, 'Здравствуйте! Готов ответить на ваши вопросы.', 3, 8, 'Performer', NOW() - INTERVAL 3 HOUR 50 MINUTE),
(12, 'Когда будет готов первый прототип?', 3, 2, 'Customer', NOW() - INTERVAL 3 HOUR 30 MINUTE),
(13, 'В течение недели подготовлю и отправлю на согласование.', 3, 8, 'Performer', NOW() - INTERVAL 3 HOUR);

-- Сообщения в чате 4 (customer3 - performer5)
INSERT IGNORE INTO messages (id, text, chat_id, sender_id, sender_type, created) VALUES
(14, 'Добрый день! Проект интернет-магазина выполнен отлично, спасибо!', 4, 4, 'Customer', NOW() - INTERVAL 1 HOUR),
(15, 'Спасибо за отзыв! Рад, что все понравилось. Если будут вопросы - обращайтесь!', 4, 10, 'Performer', NOW() - INTERVAL 30 MINUTE);

-- Сообщения в чате 5 (customer2 - performer4)
INSERT IGNORE INTO messages (id, text, chat_id, sender_id, sender_type, created) VALUES
(16, 'Привет! Интересует ваша помощь с маркетинговой кампанией.', 5, 3, 'Customer', NOW() - INTERVAL 5 HOUR),
(17, 'Здравствуйте! Расскажите подробнее о проекте.', 5, 9, 'Performer', NOW() - INTERVAL 4 HOUR 30 MINUTE),
(18, 'Нужно запустить рекламу в соцсетях для нового продукта.', 5, 3, 'Customer', NOW() - INTERVAL 4 HOUR);

-- ============================================
-- 10. ОПЫТ РАБОТЫ (WORK_EXPERIENCES) - Отзывы
-- ============================================

-- Отзывы заказчиков о исполнителях (для выполненных заказов)
INSERT IGNORE INTO work_experiences (id, name, rate, text, reviewer_type, order_id, customer_id, performer_id, created_at, updated_at) VALUES
(1, 'Отличная работа над корпоративным сайтом', 5, 'Дмитрий выполнил работу качественно и в срок. Все требования были учтены, результат превзошел ожидания. Рекомендую!', 'CUSTOMER', 9, 1, 1, NOW() - INTERVAL 1 DAY, NULL),
(2, 'Профессиональный дизайн брендбука', 5, 'Анна создала потрясающий брендбук для нашей компании. Очень довольны результатом, все детали проработаны идеально.', 'CUSTOMER', 10, 2, 2, NOW() - INTERVAL 1 DAY, NULL),
(3, 'Качественная разработка интернет-магазина', 5, 'Андрей разработал отличный интернет-магазин с удобным интерфейсом. Все функции работают стабильно, код чистый и хорошо структурированный.', 'CUSTOMER', 11, 3, 5, NOW() - INTERVAL 2 DAY, NULL);

-- Отзывы исполнителей о заказчиках
INSERT IGNORE INTO work_experiences (id, name, rate, text, reviewer_type, order_id, customer_id, performer_id, created_at, updated_at) VALUES
(4, 'Приятный заказчик, четкие требования', 5, 'Иван четко сформулировал требования к проекту, всегда был на связи. Работать было комфортно.', 'PERFORMER', 9, 1, 1, NOW() - INTERVAL 1 DAY, NULL),
(5, 'Профессиональный подход к проекту', 5, 'Мария предоставила все необходимые материалы и была открыта к обсуждению деталей. Отличный опыт сотрудничества.', 'PERFORMER', 10, 2, 2, NOW() - INTERVAL 1 DAY, NULL),
(6, 'Ответственный заказчик', 5, 'Алексей быстро принимал решения и давал обратную связь. Проект прошел гладко, без задержек.', 'PERFORMER', 11, 3, 5, NOW() - INTERVAL 2 DAY, NULL);

-- ============================================
-- 11. УВЕДОМЛЕНИЯ (NOTIFICATIONS)
-- ============================================

-- Уведомления для заказчиков
INSERT IGNORE INTO notifications (id, account_id, user_role, type, title, message, is_read, created_at, related_order_id, related_performer_id, related_customer_id) VALUES
-- Новые отклики
(1, 2, 'Customer', 'REPLY', 'Новый отклик на ваш заказ', 'Исполнитель Дмитрий Смирнов оставил отклик на заказ "Разработка веб-приложения для управления задачами"', false, NOW() - INTERVAL 4 DAY, 1, 1, 1),
(2, 2, 'Customer', 'REPLY', 'Новый отклик на ваш заказ', 'Исполнитель Сергей Лебедев оставил отклик на заказ "Разработка веб-приложения для управления задачами"', false, NOW() - INTERVAL 3 DAY, 1, 3, 1),
(3, 3, 'Customer', 'REPLY', 'Новый отклик на ваш заказ', 'Исполнитель Анна Волкова оставила отклик на заказ "Создание логотипа и фирменного стиля"', true, NOW() - INTERVAL 2 DAY, 2, 2, 2),
-- Назначение исполнителя
(4, 2, 'Customer', 'ASSIGNED', 'Исполнитель назначен', 'Исполнитель Дмитрий Смирнов назначен на заказ "Разработка API для интеграции с внешними сервисами"', true, NOW() - INTERVAL 8 DAY, 5, 1, 1),
(5, 3, 'Customer', 'ASSIGNED', 'Исполнитель назначен', 'Исполнитель Анна Волкова назначена на заказ "Дизайн интерфейса мобильного приложения"', true, NOW() - INTERVAL 5 DAY, 6, 2, 2),
-- Завершение заказа
(6, 2, 'Customer', 'COMPLETED', 'Заказ выполнен', 'Заказ "Разработка корпоративного сайта" успешно выполнен исполнителем Дмитрием Смирновым', true, NOW() - INTERVAL 2 DAY, 9, 1, 1),
(7, 3, 'Customer', 'COMPLETED', 'Заказ выполнен', 'Заказ "Брендинг и айдентика компании" успешно выполнен исполнителем Анной Волковой', true, NOW() - INTERVAL 1 DAY, 10, 2, 2),
-- Новые сообщения
(8, 2, 'Customer', 'MESSAGE', 'Новое сообщение', 'Дмитрий Смирнов отправил вам сообщение в чате', false, NOW() - INTERVAL 1 HOUR, NULL, 1, 1),
(9, 3, 'Customer', 'MESSAGE', 'Новое сообщение', 'Анна Волкова отправила вам сообщение в чате', true, NOW() - INTERVAL 2 HOUR, NULL, 2, 2);

-- Уведомления для исполнителей
INSERT IGNORE INTO notifications (id, account_id, user_role, type, title, message, is_read, created_at, related_order_id, related_performer_id, related_customer_id) VALUES
-- Одобрение отклика
(10, 6, 'Performer', 'ASSIGNED', 'Ваш отклик одобрен', 'Заказчик Иван Иванов одобрил ваш отклик на заказ "Разработка API для интеграции с внешними сервисами"', true, NOW() - INTERVAL 8 DAY, 5, 1, 1),
(11, 7, 'Performer', 'ASSIGNED', 'Ваш отклик одобрен', 'Заказчик Мария Петрова одобрила ваш отклик на заказ "Дизайн интерфейса мобильного приложения"', true, NOW() - INTERVAL 5 DAY, 6, 2, 2),
-- Требуются исправления
(12, 8, 'Performer', 'CORRECTION', 'Требуются исправления', 'Заказчик Алексей Сидоров запросил исправления в заказе "Создание лендинга для продукта"', false, NOW() - INTERVAL 1 DAY, 7, 3, 3),
-- Завершение заказа
(13, 6, 'Performer', 'COMPLETED', 'Заказ завершен', 'Заказ "Разработка корпоративного сайта" успешно завершен. Ожидается отзыв от заказчика.', true, NOW() - INTERVAL 2 DAY, 9, 1, 1),
(14, 7, 'Performer', 'COMPLETED', 'Заказ завершен', 'Заказ "Брендинг и айдентика компании" успешно завершен. Ожидается отзыв от заказчика.', true, NOW() - INTERVAL 1 DAY, 10, 2, 2),
-- Новые сообщения
(15, 6, 'Performer', 'MESSAGE', 'Новое сообщение', 'Иван Иванов отправил вам сообщение в чате', false, NOW() - INTERVAL 1 HOUR, NULL, 1, 1),
(16, 7, 'Performer', 'MESSAGE', 'Новое сообщение', 'Мария Петрова отправила вам сообщение в чате', true, NOW() - INTERVAL 2 HOUR, NULL, 2, 2);

-- Уведомления для администраторов
INSERT IGNORE INTO notifications (id, account_id, user_role, type, title, message, is_read, created_at, related_order_id, related_performer_id, related_customer_id) VALUES
(17, 1, 'Administrator', 'ON_REVIEW', 'Новый заказ на рассмотрении', 'Заказ "Разработка системы аналитики" от заказчика Елены Козловой ожидает рассмотрения', false, NOW() - INTERVAL 1 HOUR, 8, NULL, 4),
(18, 11, 'Administrator', 'ON_REVIEW', 'Новый заказ на рассмотрении', 'Заказ "Разработка системы аналитики" от заказчика Елены Козловой ожидает рассмотрения', false, NOW() - INTERVAL 1 HOUR, 8, NULL, 4);

-- ============================================
-- КОНЕЦ МИГРАЦИИ
-- ============================================

