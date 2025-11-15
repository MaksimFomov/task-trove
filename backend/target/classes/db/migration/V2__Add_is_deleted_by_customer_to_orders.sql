-- V2: Добавление поля is_deleted_by_customer в таблицу orders
-- Это поле используется для мягкого удаления заказов заказчиком

-- Добавление колонки is_deleted_by_customer
ALTER TABLE orders 
ADD COLUMN is_deleted_by_customer BOOLEAN NOT NULL DEFAULT FALSE;

-- Создание индекса для оптимизации запросов по удаленным заказам
CREATE INDEX idx_orders_is_deleted_by_customer ON orders(is_deleted_by_customer);

-- Комментарий к колонке для документации
ALTER TABLE orders 
MODIFY COLUMN is_deleted_by_customer BOOLEAN NOT NULL DEFAULT FALSE 
COMMENT 'Флаг мягкого удаления заказа заказчиком. Заказ остается в БД и виден исполнителю в завершенных заказах';
