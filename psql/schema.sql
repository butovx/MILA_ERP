-- schema.sql
-- Схема базы данных Mila ERP System

-- Удаление таблиц, если они уже существуют (для повторного создания)
DROP TABLE IF EXISTS box_items;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS boxes;

-- Создание таблицы товаров
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    barcode VARCHAR(13) UNIQUE NOT NULL,
    quantity INTEGER DEFAULT 0,
    photo_paths TEXT DEFAULT '[]',
    description TEXT,
    price DECIMAL(10, 2),
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы коробок
CREATE TABLE boxes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    barcode VARCHAR(13) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы для связи коробок и товаров
CREATE TABLE box_items (
    box_id INTEGER NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (box_id, product_id)
);

-- Индекс для быстрого поиска товаров по штрих-коду
CREATE INDEX idx_products_barcode ON products(barcode);

-- Индекс для быстрого поиска коробок по штрих-коду
CREATE INDEX idx_boxes_barcode ON boxes(barcode);

-- Индекс для поиска товаров по названию
CREATE INDEX idx_products_name ON products(LOWER(name));

-- Индекс для поиска товаров по категории
CREATE INDEX idx_products_category ON products(category);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Триггеры для обновления updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boxes_updated_at
BEFORE UPDATE ON boxes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_box_items_updated_at
BEFORE UPDATE ON box_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();