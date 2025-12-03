-- V6: Удаление неиспользуемых таблиц users и user_roles
-- Эти таблицы не используются в системе, так как аутентификация и авторизация
-- реализованы через таблицу accounts, которая связана с customers и performers

-- Сначала удаляем таблицу user_roles (может иметь внешние ключи на users)
DROP TABLE IF EXISTS user_roles;

-- Затем удаляем таблицу users
DROP TABLE IF EXISTS users;

