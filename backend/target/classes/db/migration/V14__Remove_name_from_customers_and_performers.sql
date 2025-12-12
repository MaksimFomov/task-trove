-- Удаляем поле name из таблицы customers, так как теперь используется ФИО
ALTER TABLE customers
    DROP COLUMN name;

-- Удаляем поле name из таблицы performers, так как теперь используется ФИО
ALTER TABLE performers
    DROP COLUMN name;

