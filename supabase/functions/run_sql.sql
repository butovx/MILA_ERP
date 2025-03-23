-- Функция для выполнения SQL запросов из Node.js
-- Требует создания доверенной функции (security definer)
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