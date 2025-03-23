# MILA ERP Next.js

Система управления складом и товарами, созданная с использованием Next.js, PostgreSQL и Tailwind CSS.

## Деплой на Vercel

Ветка `vercel-deploy` оптимизирована для быстрого деплоя на Vercel.

### Шаги для деплоя

1. **Создайте аккаунт на Vercel**

   - Зарегистрируйтесь на [vercel.com](https://vercel.com)

2. **Настройте проект на Vercel**

   - Импортируйте репозиторий из GitHub/GitLab/Bitbucket
   - Выберите ветку `vercel-deploy`
   - Следуйте инструкциям мастера настройки

3. **Добавьте PostgreSQL**

   - В панели управления проектом перейдите в Storage
   - Добавьте Vercel Postgres
   - Переменные окружения будут добавлены автоматически

4. **Настройте Vercel Blob**

   - В панели управления проектом перейдите в Storage
   - Добавьте Vercel Blob
   - Скопируйте токен доступа

5. **Настройте переменные окружения**

   - В настройках проекта добавьте:
     - `BLOB_READ_WRITE_TOKEN` - из Vercel Blob
     - `NEXT_PUBLIC_API_URL` - URL вашего приложения (например, https://your-app.vercel.app)

6. **Инициализируйте базу данных**
   - После деплоя запустите команду:
     ```
     npx vercel run setup-db
     ```

## Локальная разработка

```bash
# Клонирование репозитория
git clone <repo-url>
cd mila_erp_next

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev
```

## Переменные окружения

Для локальной разработки скопируйте `.env.example` в файл `.env` и заполните необходимые переменные:

```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=shop
DB_PASSWORD=postgres
DB_PORT=5432
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_token
```

## Технологии

- Next.js 15.2
- PostgreSQL
- Tailwind CSS
- Vercel Blob для хранения файлов

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
