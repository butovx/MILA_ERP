import { Pool } from "pg";
import supabase from "./supabase";
import https from "https";

// Настраиваем SSL для Node.js в продакшене
if (process.env.NODE_ENV === "production") {
  https.globalAgent.options.rejectUnauthorized = false;
}

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
        // Добавляем дополнительную логику для обхода SSL в prod
        if (process.env.NODE_ENV === "production") {
          // Убедимся, что глобальный агент настроен правильно
          https.globalAgent.options.rejectUnauthorized = false;
        }

        // Используем SQL напрямую через функцию rpc в Supabase
        const { data, error } = await supabase.rpc("run_sql", {
          sql_query: text,
          query_params: params || [],
        });

        if (error) {
          console.error("Ошибка выполнения SQL через Supabase:", error);

          // Пробуем дополнительный обход для SSL ошибок
          if (error.message && error.message.includes("certificate")) {
            console.log("Пробуем обойти ошибку SSL...");

            // Пытаемся использовать прямой fetch запрос к API
            const fetchOptions: any = {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
                Authorization: `Bearer ${
                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
                }`,
              },
              body: JSON.stringify({
                sql_query: text,
                query_params: params || [],
              }),
            };

            // Добавляем агент только на стороне сервера
            if (typeof window === "undefined") {
              fetchOptions.agent = new https.Agent({
                rejectUnauthorized: false,
              });
            }

            const response = await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/run_sql`,
              fetchOptions
            );

            if (response.ok) {
              const data = await response.json();
              return processQueryResult(data);
            }
          }

          throw error;
        }

        if (data && "error" in data) {
          console.error("SQL ошибка:", data.error);
          throw new Error(data.error as string);
        }

        return processQueryResult(data);
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

// Функция для обработки результатов запроса
function processQueryResult(data: any) {
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
}

export default pool;
