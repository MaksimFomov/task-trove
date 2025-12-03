-- V4: Создание таблицы уведомлений
-- Таблица для хранения уведомлений для пользователей о различных событиях

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    related_order_id INT NULL,
    related_performer_id INT NULL,
    related_customer_id INT NULL,
    INDEX idx_notifications_account_id (account_id),
    INDEX idx_notifications_is_read (is_read),
    INDEX idx_notifications_created_at (created_at),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Комментарии к таблице и колонкам
ALTER TABLE notifications COMMENT = 'Таблица уведомлений для пользователей о различных событиях в системе';

ALTER TABLE notifications 
MODIFY COLUMN account_id INT NOT NULL COMMENT 'ID пользователя (Account.id)',
MODIFY COLUMN user_role VARCHAR(20) NOT NULL COMMENT 'Роль пользователя: Customer, Performer, Administrator',
MODIFY COLUMN type VARCHAR(50) NOT NULL COMMENT 'Тип уведомления: REPLY, ASSIGNED, COMPLETED, CORRECTION, REFUSED, MESSAGE и т.д.',
MODIFY COLUMN title VARCHAR(255) NOT NULL COMMENT 'Заголовок уведомления',
MODIFY COLUMN message TEXT NOT NULL COMMENT 'Текст уведомления',
MODIFY COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Флаг прочтения уведомления',
MODIFY COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Время создания уведомления',
MODIFY COLUMN related_order_id INT NULL COMMENT 'ID связанного заказа (если применимо)',
MODIFY COLUMN related_performer_id INT NULL COMMENT 'ID связанного исполнителя (если применимо)',
MODIFY COLUMN related_customer_id INT NULL COMMENT 'ID связанного заказчика (если применимо)';

