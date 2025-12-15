-- V21: Удаление полей document_name и result_link, добавление поля is_spec_sent
-- для отслеживания отправки технического задания исполнителю

-- Добавляем поле is_spec_sent, если его еще нет
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'orders'
   AND COLUMN_NAME = 'is_spec_sent') = 0,
  'ALTER TABLE orders ADD COLUMN is_spec_sent BOOLEAN NOT NULL DEFAULT FALSE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Удаляем колонку document_name, если она существует
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'orders'
   AND COLUMN_NAME = 'document_name') > 0,
  'ALTER TABLE orders DROP COLUMN document_name',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Удаляем колонку result_link, если она существует
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'orders'
   AND COLUMN_NAME = 'result_link') > 0,
  'ALTER TABLE orders DROP COLUMN result_link',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

