-- V25: Удаление поля work_bind из таблицы replies
-- Это поле не используется в логике приложения

-- Удаляем колонку work_bind, если она существует
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'replies'
   AND COLUMN_NAME = 'work_bind') > 0,
  'ALTER TABLE replies DROP COLUMN work_bind',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

