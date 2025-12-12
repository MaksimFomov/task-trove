-- Создаем роль SuperAdministrator, если её еще нет
INSERT INTO roles (name, description)
SELECT 'SuperAdministrator', 'Super Administrator with full access'
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE name = 'SuperAdministrator'
);

-- Обновляем роль существующего администратора с логином "admin" на SuperAdministrator
UPDATE accounts
SET role_id = (SELECT id FROM roles WHERE name = 'SuperAdministrator' LIMIT 1)
WHERE login = 'admin'
  AND role_id = (SELECT id FROM roles WHERE name = 'Administrator' LIMIT 1);

