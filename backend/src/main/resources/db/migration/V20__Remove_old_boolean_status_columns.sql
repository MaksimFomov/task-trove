-- V20: Удаление старых boolean колонок статусов из таблицы orders
-- Эти колонки были заменены на enum status в миграции V18

-- Удаляем старые boolean колонки статусов
-- Проверяем существование перед удалением для безопасности

-- Удаляем is_actived
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'orders' 
   AND COLUMN_NAME = 'is_actived') > 0,
  'ALTER TABLE orders DROP COLUMN is_actived',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Удаляем is_in_process
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'orders' 
   AND COLUMN_NAME = 'is_in_process') > 0,
  'ALTER TABLE orders DROP COLUMN is_in_process',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Удаляем is_on_check
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'orders' 
   AND COLUMN_NAME = 'is_on_check') > 0,
  'ALTER TABLE orders DROP COLUMN is_on_check',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Удаляем is_done
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'orders' 
   AND COLUMN_NAME = 'is_done') > 0,
  'ALTER TABLE orders DROP COLUMN is_done',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Удаляем is_on_review
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'orders' 
   AND COLUMN_NAME = 'is_on_review') > 0,
  'ALTER TABLE orders DROP COLUMN is_on_review',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Удаляем is_rejected
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'orders' 
   AND COLUMN_NAME = 'is_rejected') > 0,
  'ALTER TABLE orders DROP COLUMN is_rejected',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

