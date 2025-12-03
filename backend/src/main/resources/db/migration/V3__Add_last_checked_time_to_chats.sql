-- V3: Добавление полей для отслеживания времени последней проверки чата
-- Эти поля используются для определения непрочитанных сообщений

-- Добавление колонок для времени последней проверки
ALTER TABLE chats 
ADD COLUMN last_checked_by_customer_time TIMESTAMP NULL,
ADD COLUMN last_checked_by_performer_time TIMESTAMP NULL;

-- Создание индексов для оптимизации запросов
CREATE INDEX idx_chats_last_checked_by_customer_time ON chats(last_checked_by_customer_time);
CREATE INDEX idx_chats_last_checked_by_performer_time ON chats(last_checked_by_performer_time);

-- Комментарии к колонкам для документации
ALTER TABLE chats 
MODIFY COLUMN last_checked_by_customer_time TIMESTAMP NULL 
COMMENT 'Время последней проверки чата заказчиком. Используется для определения непрочитанных сообщений';

ALTER TABLE chats 
MODIFY COLUMN last_checked_by_performer_time TIMESTAMP NULL 
COMMENT 'Время последней проверки чата исполнителем. Используется для определения непрочитанных сообщений';

