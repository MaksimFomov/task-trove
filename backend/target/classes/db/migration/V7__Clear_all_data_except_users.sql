-- V7: Очистка всех данных кроме пользователей
-- Удаляет все данные из таблиц, связанных с бизнес-логикой (заказы, чаты, сообщения и т.д.),
-- но сохраняет данные пользователей (accounts, roles, customers, performers, administrators)

-- Отключаем проверку внешних ключей для безопасного удаления
SET FOREIGN_KEY_CHECKS = 0;

-- Удаляем сообщения (зависит от chats)
DELETE FROM messages;

-- Удаляем чаты (зависит от customers, performers, administrators, orders)
DELETE FROM chats;

-- Удаляем уведомления (зависит от accounts)
DELETE FROM notifications;

-- Удаляем отклики (зависит от orders, performers)
DELETE FROM replies;

-- Удаляем заказы (зависит от customers, performers)
DELETE FROM orders;

-- Удаляем портфолио (зависит от performers)
DELETE FROM portfolios;

-- Удаляем опыт работы (зависит от customers, performers)
DELETE FROM work_experiences;

-- Включаем обратно проверку внешних ключей
SET FOREIGN_KEY_CHECKS = 1;

-- Сбрасываем AUTO_INCREMENT для всех очищенных таблиц
ALTER TABLE messages AUTO_INCREMENT = 1;
ALTER TABLE chats AUTO_INCREMENT = 1;
ALTER TABLE notifications AUTO_INCREMENT = 1;
ALTER TABLE replies AUTO_INCREMENT = 1;
ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE portfolios AUTO_INCREMENT = 1;
ALTER TABLE work_experiences AUTO_INCREMENT = 1;

