import { Pool } from "pg";
import supabase from "./supabase";
import fetch from "node-fetch";
import https from "https";

// Создаем агент для игнорирования SSL-ошибок (только для серверной части)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// Функция для прямого вызова Supabase API, минуя клиентскую библиотеку
async function directSupabaseRPC(functionName: string, params: any) {
  // Убедимся, что у нас есть все необходимые параметры
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Не настроены NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  try {
    console.log(`Прямой вызов ${functionName} через fetch`);

    // Выполняем запрос напрямую к API с использованием агента для игнорирования SSL-ошибок
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(params),
      // @ts-ignore - типы не совпадают, но это работает
      agent: typeof window === "undefined" ? httpsAgent : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Ошибка API: ${response.status} ${errorText}`);
      throw new Error(`Ошибка API: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Ошибка при прямом вызове ${functionName}:`, error);
    throw error;
  }
}

// Определим конфигурацию для подключения к базе данных
let poolConfig: any = {};
let pool: Pool;

// В зависимости от окружения используем разные подходы к подключению
if (process.env.USE_SUPABASE === "true") {
  console.log("Используем Supabase для запросов к БД");

  // В этом режиме мы используем прямой fetch API для запросов к Supabase
  const proxyPool = {
    query: async (text: string, params?: any[]) => {
      try {
        console.log("SQL запрос:", text);

        // Выполняем запрос через прямой fetch, минуя supabase клиент
        const data = await directSupabaseRPC("run_sql", {
          sql_query: text,
          query_params: params || [],
        });

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

export { Pool };
export default pool;
