import { Pool } from "pg";

// Определим конфигурацию для подключения к базе данных
let poolConfig: any = {};

// Проверка на наличие Vercel Postgres URL
if (process.env.POSTGRES_URL) {
  // Подключение через строку подключения Vercel Postgres
  poolConfig = {
    connectionString: process.env.POSTGRES_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  };
} else if (
  process.env.DB_USER &&
  process.env.DB_HOST &&
  process.env.DB_NAME &&
  process.env.DB_PASSWORD &&
  process.env.DB_PORT
) {
  // Стандартное подключение для локальной разработки
  poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT, 10),
  };
} else {
  throw new Error("Необходимо настроить переменные окружения для базы данных");
}

const pool = new Pool(poolConfig);

export default pool;
