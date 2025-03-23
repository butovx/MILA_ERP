-- Инициализация базы данных для Supabase
-- Выполните этот скрипт в SQL Editor в Supabase

-- Создание таблиц

-- Таблица товаров
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  barcode TEXT UNIQUE NOT NULL,
  quantity INTEGER DEFAULT 0,
  photo_paths JSONB DEFAULT '[]'::JSONB,
  description TEXT,
  price DECIMAL(10, 2),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица коробок
CREATE TABLE IF NOT EXISTS boxes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  barcode TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица связи товаров и коробок
CREATE TABLE IF NOT EXISTS box_items (
  box_id INTEGER REFERENCES boxes(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  PRIMARY KEY (box_id, product_id)
);

-- Создание триггеров для автоматического обновления updated_at

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для таблицы products
DROP TRIGGER IF EXISTS update_products_timestamp ON products;
CREATE TRIGGER update_products_timestamp
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Триггер для таблицы boxes
DROP TRIGGER IF EXISTS update_boxes_timestamp ON boxes;
CREATE TRIGGER update_boxes_timestamp
BEFORE UPDATE ON boxes
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Добавление функции для выполнения SQL запросов
-- Функция для выполнения SQL запросов из Node.js
CREATE OR REPLACE FUNCTION run_sql(sql_query TEXT, query_params JSONB DEFAULT '[]')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Выполняется с правами создателя функции
SET search_path = public -- Дополнительная мера безопасности
AS $$
DECLARE
  result JSONB;
  param_count INT;
  final_query TEXT;
  dynamic_sql TEXT;
  i INT;
BEGIN
  -- Проверка на опасные операции: DROP, TRUNCATE, ALTER
  IF sql_query ~* '(drop|truncate|alter|grant|revoke|vacuum|reindex)' THEN
    RAISE EXCEPTION 'Операция не разрешена: %', sql_query
      USING HINT = 'Операции DROP, TRUNCATE, ALTER и другие административные команды запрещены';
  END IF;
  
  -- Подготовка запроса с параметрами
  param_count := jsonb_array_length(query_params);
  
  -- Формируем динамический SQL запрос с явно указанными параметрами
  final_query := sql_query;
  
  -- Заменяем плейсхолдеры $1, $2, ... на значения из параметров
  IF param_count > 0 THEN
    FOR i IN 0..param_count-1 LOOP
      final_query := regexp_replace(
        final_query, 
        '\$' || (i+1)::text, 
        quote_literal(query_params->>i), 
        'g'
      );
    END LOOP;
  END IF;
  
  -- Преобразуем запрос в SELECT, который вернет JSONB
  -- Определяем тип запроса
  IF final_query ~* '^select' THEN
    -- SELECT запрос - возвращаем данные напрямую, конвертируя в JSONB
    dynamic_sql := 'SELECT jsonb_agg(row_to_json(t)) FROM (' || final_query || ') t';
  ELSIF final_query ~* '^insert' AND final_query ~* 'returning' THEN
    -- INSERT с RETURNING - возвращаем добавленные данные
    dynamic_sql := 'SELECT jsonb_agg(row_to_json(t)) FROM (' || final_query || ') t';
  ELSIF final_query ~* '^update' AND final_query ~* 'returning' THEN
    -- UPDATE с RETURNING - возвращаем обновленные данные
    dynamic_sql := 'SELECT jsonb_agg(row_to_json(t)) FROM (' || final_query || ') t';
  ELSIF final_query ~* '^delete' AND final_query ~* 'returning' THEN
    -- DELETE с RETURNING - возвращаем удаленные данные
    dynamic_sql := 'SELECT jsonb_agg(row_to_json(t)) FROM (' || final_query || ') t';
  ELSE
    -- Остальные запросы (INSERT, UPDATE, DELETE без RETURNING) - возвращаем статус выполнения
    dynamic_sql := 'WITH executed AS (' || final_query || ') SELECT jsonb_build_object(''affected_rows'', (SELECT count(*) FROM executed))';
  END IF;
  
  -- Выполняем запрос без VARIADIC
  EXECUTE dynamic_sql INTO result;
  
  -- Если результат NULL (нет данных), возвращаем пустой массив
  IF result IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Логируем ошибку и возвращаем ее текст
    RAISE NOTICE 'SQL Error: %, SQL: %', SQLERRM, sql_query;
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'query', sql_query
    );
END;
$$; 