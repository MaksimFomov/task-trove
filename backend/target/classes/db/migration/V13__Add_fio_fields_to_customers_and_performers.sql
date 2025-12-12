-- Добавляем поля ФИО в таблицу customers
ALTER TABLE customers
    ADD COLUMN last_name VARCHAR(50) NULL AFTER name,
    ADD COLUMN first_name VARCHAR(50) NULL AFTER last_name,
    ADD COLUMN middle_name VARCHAR(50) NULL AFTER first_name;

-- Переносим данные из name в first_name для обратной совместимости
UPDATE customers
SET first_name = name
WHERE first_name IS NULL AND name IS NOT NULL;

-- Добавляем поля ФИО в таблицу performers
ALTER TABLE performers
    ADD COLUMN last_name VARCHAR(50) NULL AFTER name,
    ADD COLUMN first_name VARCHAR(50) NULL AFTER last_name,
    ADD COLUMN middle_name VARCHAR(50) NULL AFTER first_name;

-- Переносим данные из name в first_name для обратной совместимости
UPDATE performers
SET first_name = name
WHERE first_name IS NULL AND name IS NOT NULL;

-- Делаем name nullable, так как теперь используем ФИО
ALTER TABLE customers
    MODIFY COLUMN name VARCHAR(100) NULL;

ALTER TABLE performers
    MODIFY COLUMN name VARCHAR(100) NULL;

