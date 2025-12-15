-- V27: Полная очистка всех данных из базы данных
-- Удаляет все данные из всех таблиц, сохраняя только структуру таблиц и системные данные (роли)
-- ВНИМАНИЕ: Эта миграция удалит ВСЕ данные, включая всех пользователей!

-- Отключаем проверку внешних ключей для безопасного удаления
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- Очистка таблиц с зависимостями (в порядке зависимостей)
-- ============================================

-- Удаляем сообщения (зависит от chats, accounts)
DELETE FROM messages;

-- Удаляем чаты (зависит от customers, performers, orders)
DELETE FROM chats;

-- Удаляем уведомления (зависит от accounts)
DELETE FROM notifications;

-- Удаляем отклики (зависит от orders, performers)
DELETE FROM replies;

-- Удаляем заказы (зависит от customers, performers)
DELETE FROM orders;

-- Удаляем опыт работы (зависит от customers, performers, orders)
DELETE FROM work_experiences;

-- Удаляем портфолио (зависит от performers, customers)
DELETE FROM portfolios;

-- Удаляем исполнителей (зависит от accounts)
DELETE FROM performers;

-- Удаляем заказчиков (зависит от accounts)
DELETE FROM customers;

-- Удаляем администраторов (зависит от accounts)
DELETE FROM administrators;

-- Удаляем все аккаунты (зависит от roles)
DELETE FROM accounts;

-- Включаем обратно проверку внешних ключей
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- Сброс AUTO_INCREMENT для всех очищенных таблиц
-- ============================================

ALTER TABLE messages AUTO_INCREMENT = 1;
ALTER TABLE chats AUTO_INCREMENT = 1;
ALTER TABLE notifications AUTO_INCREMENT = 1;
ALTER TABLE replies AUTO_INCREMENT = 1;
ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE work_experiences AUTO_INCREMENT = 1;
ALTER TABLE portfolios AUTO_INCREMENT = 1;
ALTER TABLE performers AUTO_INCREMENT = 1;
ALTER TABLE customers AUTO_INCREMENT = 1;
ALTER TABLE administrators AUTO_INCREMENT = 1;
ALTER TABLE accounts AUTO_INCREMENT = 1;

-- Примечание: Таблица roles не очищается, так как содержит системные данные (роли пользователей)

