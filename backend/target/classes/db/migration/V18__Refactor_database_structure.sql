-- V18: Рефакторинг структуры базы данных
-- Применение рекомендаций по улучшению БД

-- ============================================
-- 1. Добавление поля status в orders (enum вместо множественных boolean)
-- ============================================
-- Проверяем, существует ли колонка status, если нет - добавляем
-- Используем простой подход: пытаемся добавить, игнорируем ошибку если уже существует
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'orders' 
   AND COLUMN_NAME = 'status') = 0,
  'ALTER TABLE orders ADD COLUMN status VARCHAR(20) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Миграция данных из boolean полей в status
UPDATE orders SET status = 'REJECTED' WHERE is_rejected = TRUE;
UPDATE orders SET status = 'DONE' WHERE is_done = TRUE AND status IS NULL;
UPDATE orders SET status = 'ON_REVIEW' WHERE is_on_review = TRUE AND status IS NULL;
UPDATE orders SET status = 'ON_CHECK' WHERE is_on_check = TRUE AND status IS NULL;
UPDATE orders SET status = 'IN_PROCESS' WHERE is_in_process = TRUE AND status IS NULL;
UPDATE orders SET status = 'ACTIVE' WHERE is_actived = TRUE AND status IS NULL;

-- Устанавливаем ACTIVE по умолчанию для NULL значений
UPDATE orders SET status = 'ACTIVE' WHERE status IS NULL;

-- Делаем поле NOT NULL
ALTER TABLE orders MODIFY COLUMN status VARCHAR(20) NOT NULL;

-- Добавляем индекс для status (если его еще нет)
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'orders' 
   AND INDEX_NAME = 'idx_orders_status_new') = 0,
  'CREATE INDEX idx_orders_status_new ON orders(status)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. Обновление таблицы portfolios для поддержки Customer и Performer
-- ============================================
-- Добавляем поля для Customer (проверяем существование перед добавлением)
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'portfolios' 
   AND COLUMN_NAME = 'customer_id') = 0,
  'ALTER TABLE portfolios ADD COLUMN customer_id INT NULL AFTER performer_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'portfolios' 
   AND COLUMN_NAME = 'owner_type') = 0,
  'ALTER TABLE portfolios ADD COLUMN owner_type VARCHAR(20) NOT NULL DEFAULT ''PERFORMER'' AFTER customer_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'portfolios' 
   AND COLUMN_NAME = 'description') = 0,
  'ALTER TABLE portfolios ADD COLUMN description TEXT NULL AFTER experience',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'portfolios' 
   AND COLUMN_NAME = 'scope_s') = 0,
  'ALTER TABLE portfolios ADD COLUMN scope_s VARCHAR(255) NULL AFTER description',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Добавляем внешний ключ для customer_id (если его еще нет)
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'portfolios' 
   AND CONSTRAINT_NAME = 'fk_portfolios_customer') = 0,
  'ALTER TABLE portfolios ADD CONSTRAINT fk_portfolios_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Добавляем индексы (если их еще нет)
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'portfolios' 
   AND INDEX_NAME = 'idx_portfolios_customer_id') = 0,
  'CREATE INDEX idx_portfolios_customer_id ON portfolios(customer_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'portfolios' 
   AND INDEX_NAME = 'idx_portfolios_owner_type') = 0,
  'CREATE INDEX idx_portfolios_owner_type ON portfolios(owner_type)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Обновляем owner_type для существующих записей
UPDATE portfolios SET owner_type = 'PERFORMER' WHERE performer_id IS NOT NULL;

-- Делаем performer_id nullable, чтобы можно было создавать портфолио для заказчиков
ALTER TABLE portfolios MODIFY COLUMN performer_id INT NULL;

-- Примечание: CHECK constraint не поддерживается в MySQL до версии 8.0.16
-- Валидация будет выполняться на уровне приложения

-- ============================================
-- 3. Миграция данных из customers в portfolios
-- ============================================
-- Создаем портфолио для существующих заказчиков, у которых есть данные
-- Проверяем существование колонок и выполняем INSERT только если они существуют
SET @has_phone = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                  WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'customers' 
                  AND COLUMN_NAME = 'phone');
SET @has_description = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                        WHERE TABLE_SCHEMA = DATABASE() 
                        AND TABLE_NAME = 'customers' 
                        AND COLUMN_NAME = 'description');
SET @has_scope_s = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = 'customers' 
                    AND COLUMN_NAME = 'scope_s');

-- Строим динамический SQL для INSERT с прямым доступом к колонкам
SET @sql = CONCAT(
    'INSERT INTO portfolios (performer_id, customer_id, owner_type, name, phone, description, scope_s, is_active, email) ',
    'SELECT ',
    '    NULL, ',
    '    c.id, ',
    '    ''CUSTOMER'', ',
    '    COALESCE(CONCAT(COALESCE(c.first_name, ''''), '' '', COALESCE(c.last_name, '''')), ''Customer Portfolio''), ',
    IF(@has_phone > 0, 'c.phone', 'NULL'), ', ',
    IF(@has_description > 0, 'c.description', 'NULL'), ', ',
    IF(@has_scope_s > 0, 'c.scope_s', 'NULL'), ', ',
    '    TRUE, ',
    '    a.email ',
    'FROM customers c ',
    'INNER JOIN accounts a ON c.account_id = a.id ',
    IF(@has_phone > 0 OR @has_description > 0 OR @has_scope_s > 0,
       CONCAT('WHERE ',
              IF(@has_phone > 0, 'c.phone', 'NULL'),
              IF(@has_phone > 0, ' IS NOT NULL', ''),
              IF(@has_phone > 0 AND (@has_description > 0 OR @has_scope_s > 0), ' OR ', ''),
              IF(@has_description > 0, 'c.description', 'NULL'),
              IF(@has_description > 0, ' IS NOT NULL', ''),
              IF(@has_description > 0 AND @has_scope_s > 0, ' OR ', ''),
              IF(@has_scope_s > 0, 'c.scope_s', 'NULL'),
              IF(@has_scope_s > 0, ' IS NOT NULL', '')),
       ''),
    ' ON DUPLICATE KEY UPDATE ',
    '    phone = VALUES(phone), ',
    '    description = VALUES(description), ',
    '    scope_s = VALUES(scope_s)'
);

-- Выполняем INSERT только если колонки существуют
-- Если колонки не существуют, просто пропускаем миграцию данных
-- Используем простой подход: выполняем INSERT только если колонки существуют
-- Если хотя бы одна колонка существует, выполняем INSERT
-- Используем условный PREPARE/EXECUTE через динамический SQL
SET @should_execute = IF(@has_phone > 0 OR @has_description > 0 OR @has_scope_s > 0, 1, 0);
SET @execute_sql = IF(@should_execute > 0, 
    CONCAT('PREPARE stmt FROM ''', REPLACE(@sql, '''', ''''''), '''; EXECUTE stmt; DEALLOCATE PREPARE stmt;'),
    'SELECT 1');
SET @final_sql = @execute_sql;
PREPARE final_stmt FROM @final_sql;
EXECUTE final_stmt;
DEALLOCATE PREPARE final_stmt;

-- ============================================
-- 4. Удаление полей из customers (перенесены в portfolios)
-- ============================================
-- Удаляем колонки только если они существуют
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'customers' 
   AND COLUMN_NAME = 'phone') > 0,
  'ALTER TABLE customers DROP COLUMN phone',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'customers' 
   AND COLUMN_NAME = 'description') > 0,
  'ALTER TABLE customers DROP COLUMN description',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'customers' 
   AND COLUMN_NAME = 'scope_s') > 0,
  'ALTER TABLE customers DROP COLUMN scope_s',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 5. Исправление notifications - добавление внешнего ключа
-- ============================================
-- Добавляем внешний ключ (если его еще нет)
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'notifications' 
   AND CONSTRAINT_NAME = 'fk_notifications_account') = 0,
  'ALTER TABLE notifications ADD CONSTRAINT fk_notifications_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 6. Исправление messages - добавление внешнего ключа
-- ============================================
-- Добавляем внешний ключ (если его еще нет)
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'messages' 
   AND CONSTRAINT_NAME = 'fk_messages_sender') = 0,
  'ALTER TABLE messages ADD CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES accounts(id) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 7. Удаление дублирования email из administrators
-- ============================================
-- Удаляем индекс на email, если он существует
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'administrators' 
   AND INDEX_NAME = 'idx_administrators_email') > 0,
  'DROP INDEX idx_administrators_email ON administrators',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Удаляем колонку email (если она существует)
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'administrators' 
   AND COLUMN_NAME = 'email') > 0,
  'ALTER TABLE administrators DROP COLUMN email',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 8. Унификация типов времени в chats
-- ============================================
-- Изменяем тип last_message_time с DATETIME на TIMESTAMP
-- MySQL не поддерживает TIMESTAMP WITH TIME ZONE напрямую, используем DATETIME(6) для большей точности
-- или TIMESTAMP, который автоматически конвертируется в UTC
ALTER TABLE chats MODIFY COLUMN last_message_time TIMESTAMP NULL;

-- ============================================
-- 9. Удаление устаревших индексов и полей (опционально, можно оставить для обратной совместимости)
-- ============================================
-- Оставляем старые boolean поля для обратной совместимости, но они больше не используются
-- Можно удалить их в следующей миграции после обновления всего кода

-- Удаляем старый составной индекс на boolean поля (если существует)
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'orders' 
   AND INDEX_NAME = 'idx_orders_status') > 0,
  'DROP INDEX idx_orders_status ON orders',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

