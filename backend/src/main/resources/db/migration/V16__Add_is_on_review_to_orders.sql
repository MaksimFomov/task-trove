-- V16: Добавление поля is_on_review (на рассмотрении) в таблицу orders
-- Это поле указывает, что заказ находится на рассмотрении у администратора
-- и еще не одобрен для публикации

ALTER TABLE orders 
ADD COLUMN is_on_review BOOLEAN NOT NULL DEFAULT FALSE;

-- Обновляем существующие заказы - считаем их уже одобренными
UPDATE orders SET is_on_review = FALSE WHERE is_on_review IS NULL;

-- Добавляем индекс для быстрого поиска заказов на рассмотрении
CREATE INDEX idx_orders_is_on_review ON orders(is_on_review);

-- Примечание: Индекс idx_orders_status уже существует и включает поля (is_actived, is_in_process, is_on_check, is_done)
-- Мы не удаляем старый индекс, так как он все еще может быть полезен
-- Новое поле is_on_review имеет свой отдельный индекс idx_orders_is_on_review для быстрой фильтрации

