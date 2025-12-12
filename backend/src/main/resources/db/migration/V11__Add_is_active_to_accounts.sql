-- Добавляем поле is_active в таблицу accounts
ALTER TABLE accounts
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER password;

-- Создаем индекс для is_active
CREATE INDEX idx_accounts_is_active ON accounts(is_active);

