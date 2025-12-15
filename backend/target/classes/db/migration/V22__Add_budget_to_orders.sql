-- V22: Добавление поля budget (бюджет) в таблицу orders

-- Добавляем поле budget, если его еще нет
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'orders'
   AND COLUMN_NAME = 'budget') = 0,
  'ALTER TABLE orders ADD COLUMN budget DECIMAL(15, 2) NULL COMMENT ''Бюджет заказа''',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

