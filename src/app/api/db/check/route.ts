import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";
import { supabaseUrl, supabaseKey } from "@/lib/supabase";

/**
 * Простая проверка подключения к Supabase
 */
export async function GET() {
  try {
    // Проверяем наличие функции exec_sql
    let hasExecSql = false;
    try {
      const { data: sqlData, error: sqlError } = await supabase.rpc(
        "exec_sql",
        {
          query: "SELECT 1 as test",
        }
      );
      hasExecSql = !sqlError;
    } catch (e) {
      console.log("exec_sql не найдена:", e);
    }

    // Проверяем наличие таблицы todos
    let hasTodosTable = false;
    let todosErrorMessage = null;
    try {
      const { data, error } = await supabase
        .from("todos")
        .select("count")
        .limit(1);
      hasTodosTable = !error;
      todosErrorMessage = error?.message || null;
    } catch (e: any) {
      console.log("Ошибка при проверке таблицы todos:", e);
      todosErrorMessage = e?.message || "Неизвестная ошибка";
    }

    // Получаем сведения о сервере
    let serverInfo = null;
    try {
      // Пробуем получить информацию через REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
        },
      });

      if (response.ok) {
        serverInfo = {
          statusCode: response.status,
          statusText: response.statusText,
        };
      }
    } catch (e) {
      console.log("Ошибка при получении информации о сервере:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Проверка статуса подключения выполнена",
      db: {
        connected: true,
        supabaseUrl,
        features: {
          exec_sql: hasExecSql,
        },
        tables: {
          todos: {
            exists: hasTodosTable,
            error: todosErrorMessage,
          },
        },
        serverInfo,
      },
    });
  } catch (error: any) {
    console.error("Непредвиденная ошибка:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при проверке подключения к базе данных",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
