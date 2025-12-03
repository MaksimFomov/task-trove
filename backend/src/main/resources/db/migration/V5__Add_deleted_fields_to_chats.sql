-- V5: Добавление полей для мягкого удаления чатов
-- Эти поля используются для отслеживания удаления чата каждым пользователем отдельно

-- Добавление колонок для мягкого удаления
ALTER TABLE chats 
ADD COLUMN deleted_by_customer BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN deleted_by_performer BOOLEAN NOT NULL DEFAULT FALSE;

-- Создание индексов для оптимизации запросов
CREATE INDEX idx_chats_deleted_by_customer ON chats(deleted_by_customer);
CREATE INDEX idx_chats_deleted_by_performer ON chats(deleted_by_performer);

-- Комментарии к колонкам для документации
ALTER TABLE chats 
MODIFY COLUMN deleted_by_customer BOOLEAN NOT NULL DEFAULT FALSE 
COMMENT 'Флаг удаления чата заказчиком. Чат скрыт только для заказчика, но остается видимым для исполнителя';

ALTER TABLE chats 
MODIFY COLUMN deleted_by_performer BOOLEAN NOT NULL DEFAULT FALSE 
COMMENT 'Флаг удаления чата исполнителем. Чат скрыт только для исполнителя, но остается видимым для заказчика';

