-- V23: Удаление флагов is_done_this_task, is_on_customer, donned из таблицы replies
-- Эти флаги дублируют информацию, которая уже есть в статусе Order и performer_id

-- Удаляем колонку is_done_this_task, если она существует
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'replies'
   AND COLUMN_NAME = 'is_done_this_task') > 0,
  'ALTER TABLE replies DROP COLUMN is_done_this_task',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Удаляем колонку is_on_customer, если она существует
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'replies'
   AND COLUMN_NAME = 'is_on_customer') > 0,
  'ALTER TABLE replies DROP COLUMN is_on_customer',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Удаляем колонку donned, если она существует
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'replies'
   AND COLUMN_NAME = 'donned') > 0,
  'ALTER TABLE replies DROP COLUMN donned',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

