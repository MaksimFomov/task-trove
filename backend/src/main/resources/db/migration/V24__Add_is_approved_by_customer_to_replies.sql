-- V24: Добавление поля is_approved_by_customer в таблицу replies
-- Флаг указывает, одобрен ли отклик заказчиком

-- Добавляем поле is_approved_by_customer, если его еще нет
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'replies'
   AND COLUMN_NAME = 'is_approved_by_customer') = 0,
  'ALTER TABLE replies ADD COLUMN is_approved_by_customer BOOLEAN NOT NULL DEFAULT FALSE COMMENT ''Одобрен ли отклик заказчиком''',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Устанавливаем is_approved_by_customer = TRUE для существующих откликов, 
-- где исполнитель уже назначен на заказ (order.performer_id = reply.performer_id)
UPDATE replies r
INNER JOIN orders o ON r.order_id = o.id
SET r.is_approved_by_customer = TRUE
WHERE o.performer_id = r.performer_id;

