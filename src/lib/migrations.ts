import * as fs from "fs";
import * as path from "path";
import supabase from "./supabase";
import { supabaseUrl, supabaseKey } from "./supabase";

/**
 * Запускает SQL-миграцию напрямую через Supabase API
 * @param sql SQL-запрос для выполнения
 * @returns
 */
async function executeSql(
  sql: string
): Promise<{ success: boolean; error?: any }> {
  try {
    // Сначала пробуем выполнить через RPC
    try {
      const { data, error } = await supabase.rpc("exec_sql", { query: sql });

      if (!error) {
        return { success: true, error: null };
      }

      // Если функция не существует, продолжаем с прямым запросом
      console.log("RPC функция exec_sql недоступна, используем REST API");
    } catch (rpcError) {
      console.log("Ошибка при использовании RPC:", rpcError);
    }

    // Если RPC не сработал, пробуем выполнить через REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
        apikey: `${supabaseKey}`,
        Prefer: "tx=commit",
        "X-Supabase-Direct-SQL": "true",
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Ошибка выполнения SQL через REST API:", errorData);
      return { success: false, error: errorData };
    }

    return { success: true };
  } catch (error) {
    console.error("Ошибка выполнения SQL:", error);
    return { success: false, error };
  }
}

/**
 * Проверяет доступность хранимой функции exec_sql
 */
async function checkExecSqlFunction(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("exec_sql", {
      query: "SELECT 1 as test",
    });

    if (error) {
      console.log("Функция exec_sql недоступна:", error.message);
      return false;
    }

    console.log("Функция exec_sql доступна");
    return true;
  } catch (error) {
    console.log("Ошибка при проверке функции exec_sql:", error);
    return false;
  }
}

/**
 * Запускает все SQL-миграции из указанной директории
 * @param migrationsDir Путь к директории с SQL-миграциями
 */
export async function runMigrations(
  migrationsDir = path.join(process.cwd(), "src/db/migrations")
) {
  try {
    // Проверяем существование директории
    if (!fs.existsSync(migrationsDir)) {
      console.error(`Директория миграций не найдена: ${migrationsDir}`);
      return false;
    }

    console.log(`Запуск миграций из директории: ${migrationsDir}`);

    // Получаем список файлов миграций, сортируем их по имени
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    if (migrationFiles.length === 0) {
      console.log("Миграции не найдены");
      return false;
    }

    console.log(`Найдено миграций: ${migrationFiles.length}`);

    // Выполняем миграции последовательно
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      console.log(`Выполняем миграцию: ${file}`);

      // Читаем содержимое SQL-файла
      const sql = fs.readFileSync(filePath, "utf-8");

      // Выполняем SQL через API Supabase
      const { success, error } = await executeSql(sql);

      if (!success) {
        console.error(`Ошибка при выполнении миграции ${file}:`, error);
        return false;
      }

      console.log(`Миграция ${file} успешно выполнена`);
    }

    console.log("Все миграции успешно выполнены");
    return true;
  } catch (error) {
    console.error("Ошибка при выполнении миграций:", error);
    return false;
  }
}

/**
 * Проверяет соединение с базой данных
 */
export async function checkDbConnection() {
  try {
    // Проверка на существование любой системной таблицы
    try {
      const { data, error } = await supabase
        .from("pg_catalog")
        .select("*")
        .limit(1);

      if (!error) {
        console.log("Соединение с БД успешно установлено");
        return true;
      }
    } catch (queryError) {
      console.log("Ошибка при выполнении запроса к pg_catalog:", queryError);
    }

    // Альтернативный метод проверки подключения
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );

      if (response.ok) {
        console.log(
          "Соединение с БД успешно установлено (альтернативный метод)"
        );
        return true;
      }
    } catch (fetchError) {
      console.error(
        "Ошибка при выполнении альтернативного запроса:",
        fetchError
      );
    }

    console.error("Ошибка при проверке соединения с БД");
    return false;
  } catch (error) {
    console.error("Ошибка при проверке соединения с БД:", error);
    return false;
  }
}
