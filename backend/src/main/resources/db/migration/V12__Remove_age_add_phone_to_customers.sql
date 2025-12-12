-- Удаляем поле age из таблицы customers
ALTER TABLE customers
    DROP COLUMN age;

-- Добавляем поле phone как необязательное
ALTER TABLE customers
    ADD COLUMN phone VARCHAR(50) NULL AFTER name;

-- Создаем индекс для phone
CREATE INDEX idx_customers_phone ON customers(phone);

