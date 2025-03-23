import pool from "@/lib/db";
import supabase from "@/lib/supabase";

/**
 * Функция для проверки подключения к базе данных
 * Возвращает статус подключения и информацию о базе данных
 */
export async function verifyDatabaseConnection() {
  try {
    // Выполняем простой SELECT запрос
    const result = await pool.query("SELECT version() as version");

    if (result.rows.length > 0) {
      return {
        success: true,
        message: "Подключение к базе данных успешно",
        version: result.rows[0].version,
        provider:
          process.env.USE_SUPABASE === "true"
            ? "Supabase"
            : process.env.POSTGRES_URL
            ? "Vercel Postgres"
            : "Local PostgreSQL",
      };
    } else {
      return {
        success: false,
        message: "Не удалось получить информацию о версии базы данных",
        provider:
          process.env.USE_SUPABASE === "true"
            ? "Supabase"
            : process.env.POSTGRES_URL
            ? "Vercel Postgres"
            : "Local PostgreSQL",
      };
    }
  } catch (error: any) {
    console.error("Ошибка проверки подключения к базе данных:", error);
    return {
      success: false,
      message: `Ошибка подключения к базе данных: ${error.message}`,
      error,
      provider:
        process.env.USE_SUPABASE === "true"
          ? "Supabase"
          : process.env.POSTGRES_URL
          ? "Vercel Postgres"
          : "Local PostgreSQL",
    };
  }
}

/**
 * Функция для проверки схемы базы данных
 * Проверяет наличие необходимых таблиц
 */
export async function verifyDatabaseSchema() {
  try {
    // Проверяем наличие всех необходимых таблиц
    const requiredTables = ["products", "boxes", "box_items"];

    // Получаем список таблиц из базы данных
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const existingTables = result.rows.map((row) => row.table_name);

    // Проверяем, все ли необходимые таблицы существуют
    const missingTables = requiredTables.filter(
      (table) => !existingTables.includes(table)
    );

    if (missingTables.length === 0) {
      return {
        success: true,
        message: "Все необходимые таблицы существуют",
        tables: existingTables,
      };
    } else {
      return {
        success: false,
        message: `Отсутствуют таблицы: ${missingTables.join(", ")}`,
        missingTables,
        existingTables,
      };
    }
  } catch (error: any) {
    console.error("Ошибка проверки схемы базы данных:", error);
    return {
      success: false,
      message: `Ошибка проверки схемы базы данных: ${error.message}`,
      error,
    };
  }
}
