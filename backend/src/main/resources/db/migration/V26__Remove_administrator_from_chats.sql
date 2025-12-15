-- V26: Удаление полей administrator_id и check_by_administrator из таблицы chats
-- Чаты используются только между заказчиком и исполнителем

-- Сначала удаляем внешний ключ administrator_id, если он существует
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
   WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'chats'
   AND CONSTRAINT_NAME = 'fk_chats_administrator') > 0,
  'ALTER TABLE chats DROP FOREIGN KEY fk_chats_administrator',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Затем удаляем индекс administrator_id, если он существует
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'chats'
   AND INDEX_NAME = 'idx_chats_administrator_id') > 0,
  'DROP INDEX idx_chats_administrator_id ON chats',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Удаляем колонку administrator_id, если она существует
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'chats'
   AND COLUMN_NAME = 'administrator_id') > 0,
  'ALTER TABLE chats DROP COLUMN administrator_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Удаляем колонку check_by_administrator, если она существует
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'chats'
   AND COLUMN_NAME = 'check_by_administrator') > 0,
  'ALTER TABLE chats DROP COLUMN check_by_administrator',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

