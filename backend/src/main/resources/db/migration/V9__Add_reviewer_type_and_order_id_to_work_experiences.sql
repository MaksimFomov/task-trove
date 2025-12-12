-- Добавляем поле reviewer_type для указания, кто оставил отзыв (CUSTOMER или PERFORMER)
ALTER TABLE work_experiences
    ADD COLUMN reviewer_type VARCHAR(20) NULL AFTER text;

-- Добавляем поле order_id для связи с заказом
ALTER TABLE work_experiences
    ADD COLUMN order_id INT NULL AFTER reviewer_type;

-- Добавляем внешний ключ для order_id
ALTER TABLE work_experiences
    ADD CONSTRAINT fk_work_experiences_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE SET NULL;

-- Добавляем индекс для order_id
CREATE INDEX idx_work_experiences_order_id ON work_experiences(order_id);

-- Добавляем индекс для reviewer_type
CREATE INDEX idx_work_experiences_reviewer_type ON work_experiences(reviewer_type);

