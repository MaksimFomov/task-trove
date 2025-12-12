-- V17: Добавление поля is_rejected в таблицу orders
-- Поле для отслеживания отклоненных администратором заказов

ALTER TABLE orders ADD COLUMN is_rejected BOOLEAN NOT NULL DEFAULT FALSE;

-- Обновляем существующие записи
UPDATE orders SET is_rejected = FALSE WHERE is_rejected IS NULL;

-- Добавляем индекс для быстрого поиска отклоненных заказов
CREATE INDEX idx_orders_is_rejected ON orders(is_rejected);

-- Примечание: Составной индекс idx_orders_status уже существует в V16 и включает поля 
-- (is_actived, is_in_process, is_on_check, is_done, is_on_review).
-- Новое поле is_rejected имеет свой отдельный индекс idx_orders_is_rejected для быстрой фильтрации.

