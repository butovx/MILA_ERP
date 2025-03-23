import { Pool } from "pg";
import supabase from "./supabase";

// Определим конфигурацию для подключения к базе данных
let poolConfig: any = {};
let pool: Pool;

// В зависимости от окружения используем разные подходы к подключению
if (process.env.USE_SUPABASE === "true") {
  // В этом режиме мы будем использовать клиент Supabase напрямую
  // и экспортировать прокси-объект, который имеет метод query для совместимости
  const proxyPool = {
    query: async (text: string, params?: any[]) => {
      try {
        // Используем SQL напрямую через функцию rpc в Supabase
        const { data, error } = await supabase.rpc("run_sql", {
          sql_query: text,
          query_params: params || [],
        });

        if (error) {
          console.error("Ошибка выполнения SQL через Supabase:", error);
          throw error;
        }

        if (data && "error" in data) {
          console.error("SQL ошибка:", data.error);
          throw new Error(data.error as string);
        }

        // Проверяем, возвращает ли запрос affected_rows (не SELECT запрос)
        if (data && typeof data === "object" && "affected_rows" in data) {
          return {
            rows: [],
            rowCount: data.affected_rows as number,
          };
        }

        // Для SELECT запросов и запросов с RETURNING
        return {
          rows: Array.isArray(data) ? data : [],
          rowCount: Array.isArray(data) ? data.length : 0,
        };
      } catch (err) {
        console.error("Ошибка выполнения SQL через Supabase:", err);
        throw err;
      }
    },
  };

  pool = proxyPool as unknown as Pool;
} else if (process.env.POSTGRES_URL) {
  // Подключение через строку подключения Vercel Postgres или другой сервис
  poolConfig = {
    connectionString: process.env.POSTGRES_URL,
    ssl: {
      rejectUnauthorized: false, // Пропускаем проверку SSL сертификатов
    },
  };
  pool = new Pool(poolConfig);
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
  pool = new Pool(poolConfig);
} else {
  throw new Error("Необходимо настроить переменные окружения для базы данных");
}

export default pool;
