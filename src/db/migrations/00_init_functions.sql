-- Создание функции для выполнения произвольных SQL-запросов
-- Эта функция будет использоваться в системе миграций

-- Сначала убедимся, что у нас есть расширение pgcrypto для генерации UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Включение расширения для поддержки PostgreSQL JSON
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица для отслеживания выполненных миграций
CREATE TABLE IF NOT EXISTS public.migrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checksum TEXT,
  execution_time INT
);

-- Функция для выполнения произвольного SQL
CREATE OR REPLACE FUNCTION public.exec_sql(query TEXT) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  start_time TIMESTAMPTZ;
  execution_time INT;
  affected_rows INT;
BEGIN
  -- Записываем время начала выполнения
  start_time := clock_timestamp();
  
  -- Выполняем запрос
  EXECUTE query;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- Вычисляем время выполнения в миллисекундах
  execution_time := EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) * 1000;
  
  -- Формируем результат
  result := jsonb_build_object(
    'success', true,
    'affected_rows', affected_rows,
    'execution_time_ms', execution_time
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_detail', SQLSTATE
  );
  
  RETURN result;
END;
$$; 