# Список таблиц базы данных

Данный документ содержит список всех таблиц базы данных проекта Task Trove, основанный на моделях (Entity классах) бэкенда.

---

## Таблицы базы данных

### 1. `accounts`
**Модель:** `Account`  
**Описание:** Таблица для хранения учетных записей пользователей (аккаунтов)  
**Основные поля:**
- `id` (PK)
- `email` (unique, not null)
- `password` (not null)
- `is_active` (not null)
- `role_id` (FK → roles.id)

**Индексы:**
- `idx_accounts_email` на `email`
- `idx_accounts_role_id` на `role_id`

---

### 2. `roles`
**Модель:** `Role`  
**Описание:** Таблица для хранения ролей пользователей  
**Основные поля:**
- `id` (PK)
- `name` (unique, not null)
- `description`

---

### 3. `customers`
**Модель:** `Customer`  
**Описание:** Таблица для хранения данных заказчиков  
**Основные поля:**
- `id` (PK)
- `account_id` (FK → accounts.id, unique, not null)
- `last_name`
- `first_name`
- `middle_name`

**Индексы:**
- `idx_customers_account_id` на `account_id`

**Связи:**
- One-to-One с `accounts`
- One-to-Many с `portfolios`
- One-to-Many с `chats`
- One-to-Many с `orders`
- One-to-Many с `work_experiences`

---

### 4. `performers`
**Модель:** `Performer`  
**Описание:** Таблица для хранения данных исполнителей  
**Основные поля:**
- `id` (PK)
- `account_id` (FK → accounts.id, unique, not null)
- `age` (not null)
- `last_name`
- `first_name`
- `middle_name`
- `rating`

**Индексы:**
- `idx_performers_account_id` на `account_id`
- `idx_performers_rating` на `rating`

**Связи:**
- One-to-One с `accounts`
- One-to-Many с `chats`
- One-to-Many с `orders`
- One-to-Many с `replies`
- One-to-Many с `work_experiences`
- One-to-Many с `portfolios`

---

### 5. `administrators`
**Модель:** `Administrator`  
**Описание:** Таблица для хранения данных администраторов  
**Основные поля:**
- `id` (PK)
- `account_id` (FK → accounts.id, unique, not null)
- `name` (not null)

**Индексы:**
- `idx_administrators_account_id` на `account_id`

**Связи:**
- One-to-One с `accounts`

---

### 6. `orders`
**Модель:** `Orders`  
**Описание:** Таблица для хранения заказов  
**Основные поля:**
- `id` (PK)
- `title` (not null)
- `scope` (not null)
- `stack_s`
- `description` (TEXT)
- `customer_id` (FK → customers.id, not null)
- `performer_id` (FK → performers.id, nullable)
- `status` (ENUM: ACTIVE, IN_PROCESS, ON_CHECK, ON_REVIEW, DONE, REJECTED, not null)
- `is_deleted_by_customer` (not null, default: false)
- `publication_time` (not null)
- `start_time`
- `end_time`
- `budget` (DECIMAL)
- `is_spec_sent` (not null, default: false)
- `reply_bind` (not null, default: 0)

**Индексы:**
- `idx_orders_customer_id` на `customer_id`
- `idx_orders_performer_id` на `performer_id`
- `idx_orders_publication_time` на `publication_time`
- `idx_orders_status` на `status`
- `idx_orders_title` на `title`

**Связи:**
- Many-to-One с `customers`
- Many-to-One с `performers`
- One-to-Many с `replies`
- One-to-Many с `work_experiences`

---

### 7. `replies`
**Модель:** `Reply`  
**Описание:** Таблица для хранения откликов исполнителей на заказы  
**Основные поля:**
- `id` (PK)
- `order_id` (FK → orders.id, not null)
- `performer_id` (FK → performers.id, not null)
- `is_approved_by_customer` (not null, default: false)

**Индексы:**
- `idx_replies_order_id` на `order_id`
- `idx_replies_performer_id` на `performer_id`

**Связи:**
- Many-to-One с `orders`
- Many-to-One с `performers`

---

### 8. `chats`
**Модель:** `Chat`  
**Описание:** Таблица для хранения чатов между заказчиками и исполнителями  
**Основные поля:**
- `id` (PK)
- `customer_id` (FK → customers.id, not null)
- `performer_id` (FK → performers.id, not null)
- `room_name` (not null)
- `last_message_time`
- `check_by_customer` (not null, default: false)
- `check_by_performer` (not null, default: false)
- `last_checked_by_customer_time`
- `last_checked_by_performer_time`
- `deleted_by_customer` (not null, default: false)
- `deleted_by_performer` (not null, default: false)

**Индексы:**
- `idx_chats_customer_id` на `customer_id`
- `idx_chats_performer_id` на `performer_id`
- `idx_chats_last_message_time` на `last_message_time`

**Связи:**
- Many-to-One с `customers`
- Many-to-One с `performers`
- One-to-Many с `messages`

---

### 9. `messages`
**Модель:** `Message`  
**Описание:** Таблица для хранения сообщений в чатах  
**Основные поля:**
- `id` (PK)
- `text` (TEXT, not null)
- `chat_id` (FK → chats.id, not null)
- `sender_id` (FK → accounts.id, not null)
- `sender_type` (not null) - "Customer", "Performer", "Administrator"
- `created` (not null)

**Индексы:**
- `idx_messages_chat_id` на `chat_id`
- `idx_messages_created` на `created`
- `idx_messages_sender_id` на `sender_id`

**Связи:**
- Many-to-One с `chats`
- Many-to-One с `accounts`

---

### 10. `notifications`
**Модель:** `Notification`  
**Описание:** Таблица для хранения уведомлений пользователей  
**Основные поля:**
- `id` (PK)
- `account_id` (FK → accounts.id, not null)
- `user_role` (not null) - "Customer", "Performer", "Administrator"
- `type` (not null) - "REPLY", "ASSIGNED", "COMPLETED", "CORRECTION", "REFUSED", "MESSAGE", "ORDER_REVIEW", "ORDER_APPROVED", "ORDER_REJECTED", "REVIEW", "PERFORMER_NOT_SELECTED"
- `title` (not null)
- `message` (TEXT, not null)
- `is_read` (not null, default: false)
- `created_at` (not null)
- `related_order_id` (nullable)
- `related_performer_id` (nullable)
- `related_customer_id` (nullable)

**Индексы:**
- `idx_notifications_account_id` на `account_id`
- `idx_notifications_is_read` на `is_read`
- `idx_notifications_created_at` на `created_at`

**Связи:**
- Many-to-One с `accounts`

---

### 11. `portfolios`
**Модель:** `Portfolio`  
**Описание:** Таблица для хранения портфолио заказчиков и исполнителей  
**Основные поля:**
- `id` (PK)
- `performer_id` (FK → performers.id, nullable)
- `customer_id` (FK → customers.id, nullable)
- `owner_type` (not null) - "PERFORMER" or "CUSTOMER"
- `name` (not null)
- `phone`
- `email`
- `town_country`
- `specializations` (TEXT)
- `employment` (TEXT)
- `experience` (TEXT)
- `description` (TEXT) - для заказчиков
- `scope_s` - для заказчиков
- `is_active` (not null, default: false)

**Индексы:**
- `idx_portfolios_performer_id` на `performer_id`
- `idx_portfolios_customer_id` на `customer_id`
- `idx_portfolios_is_active` на `is_active`
- `idx_portfolios_owner_type` на `owner_type`

**Связи:**
- Many-to-One с `performers`
- Many-to-One с `customers`

---

### 12. `work_experiences`
**Модель:** `WorkExperience`  
**Описание:** Таблица для хранения отзывов (work experiences) между заказчиками и исполнителями  
**Основные поля:**
- `id` (PK)
- `name` (not null)
- `rate` (not null) - оценка от 1 до 5
- `text` (TEXT)
- `reviewer_type` (ENUM: CUSTOMER, PERFORMER)
- `order_id` (FK → orders.id, nullable)
- `created_at` (not null)
- `updated_at`
- `customer_id` (FK → customers.id, not null)
- `performer_id` (FK → performers.id, not null)

**Индексы:**
- `idx_work_experiences_customer_id` на `customer_id`
- `idx_work_experiences_performer_id` на `performer_id`
- `idx_work_experiences_created_at` на `created_at`
- `idx_work_experiences_order_id` на `order_id`
- `idx_work_experiences_reviewer_type` на `reviewer_type`

**Связи:**
- Many-to-One с `customers`
- Many-to-One с `performers`
- Many-to-One с `orders`

---

## Перечисления (Enums)

Следующие перечисления используются в таблицах, но не создают отдельных таблиц:

### `OrderStatus`
Используется в таблице `orders` (поле `status`):
- `ACTIVE` - Заказ активен и доступен для откликов
- `IN_PROCESS` - Заказ в работе (назначен исполнитель)
- `ON_CHECK` - Заказ на проверке
- `ON_REVIEW` - Заказ на рассмотрении
- `DONE` - Заказ выполнен
- `REJECTED` - Заказ отклонен

### `ReviewerType`
Используется в таблице `work_experiences` (поле `reviewer_type`):
- `CUSTOMER` - Отзыв оставлен заказчиком
- `PERFORMER` - Отзыв оставлен исполнителем

---

## Итого

**Всего таблиц: 12**

1. accounts
2. roles
3. customers
4. performers
5. administrators
6. orders
7. replies
8. chats
9. messages
10. notifications
11. portfolios
12. work_experiences

---

## Примечания

- Все таблицы используют автоинкремент для первичных ключей (`GenerationType.IDENTITY`)
- Внешние ключи (Foreign Keys) имеют именованные ограничения для удобства управления
- Большинство таблиц имеют индексы на часто используемых полях для оптимизации запросов
- Некоторые поля имеют значения по умолчанию, устанавливаемые через `@PrePersist` или в коде
- Связи между таблицами реализованы через JPA аннотации (`@OneToOne`, `@OneToMany`, `@ManyToOne`, `@ManyToMany`)

