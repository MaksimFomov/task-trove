-- V19: Удаление поля login из таблицы accounts
-- Поле login дублирует email и больше не нужно

-- Удаляем индекс на login, если он существует
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'accounts' 
   AND INDEX_NAME = 'idx_accounts_login') > 0,
  'DROP INDEX idx_accounts_login ON accounts',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Удаляем колонку login (если она существует)
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'accounts' 
   AND COLUMN_NAME = 'login') > 0,
  'ALTER TABLE accounts DROP COLUMN login',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

