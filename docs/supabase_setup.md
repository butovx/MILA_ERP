# Настройка Supabase для MILA ERP

## Шаг 1: Получение ключа доступа

1. Перейдите в проект Supabase по адресу [https://app.supabase.io/project/ogmfhgrxwqljcglegzkb](https://app.supabase.io/project/ogmfhgrxwqljcglegzkb)
2. Перейдите во вкладку "Project Settings" (значок шестеренки)
3. Выберите "API" в боковом меню
4. Скопируйте следующие значения:
   - `service_role key` (для переменной `SUPABASE_KEY`)

## Шаг 2: Создание функции для выполнения SQL

1. В проекте Supabase перейдите в "SQL Editor" (значок кода)
2. Создайте новый SQL запрос, нажав "New query"
3. Вставьте SQL код из файла `supabase/functions/run_sql.sql`
4. Выполните запрос, нажав на кнопку "Run"

## Шаг 3: Создание таблиц базы данных

1. В проекте Supabase перейдите в "SQL Editor"
2. Создайте новый SQL запрос
3. Вставьте SQL скрипт из файла `supabase/init.sql` или используйте следующий код для создания таблиц:

```sql
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
```

4. Выполните запрос, нажав на кнопку "Run"

## Шаг 4: Настройка переменных окружения в Vercel

1. В проекте Vercel перейдите в Settings -> Environment Variables
2. Добавьте следующие переменные:
   - `USE_SUPABASE`: `true`
   - `SUPABASE_KEY`: Ключ service_role из шага 1

## Шаг 5: Редеплой приложения

После настройки переменных окружения выполните повторный деплой приложения:

1. Перейдите в Deployments в вашем проекте Vercel
2. Нажмите кнопку "Redeploy" для последнего деплоя

## Проверка настройки

Для проверки правильности настройки:

1. Откройте приложение
2. Перейдите по адресу `/api/system/db-status` для проверки статуса соединения с базой данных
3. Попробуйте добавить тестовый товар или коробку
4. Проверьте, отображаются ли добавленные данные в приложении

## Локальная разработка с Supabase

Для тестирования с Supabase на локальном окружении:

1. Скопируйте файл `.env.example` в `.env.local`
2. Установите `USE_SUPABASE=true`
3. Укажите ваш ключ Supabase:
   ```
   SUPABASE_KEY=your-supabase-key
   ```
4. Запустите приложение с помощью `npm run dev`
