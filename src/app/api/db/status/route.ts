import { NextResponse } from "next/server";
import { checkDbConnection } from "@/lib/migrations";
import supabase from "@/lib/supabase";

export async function GET() {
  try {
    // Проверяем соединение с базой данных
    const isConnected = await checkDbConnection();

    // Получаем информацию о системе из Supabase
    let systemInfo = null;
    let systemError = null;
    try {
      const result = await supabase
        .from("_prisma_migrations")
        .select("*")
        .limit(1);
      systemInfo = result.data;
      systemError = result.error;
    } catch (err: any) {
      systemError = {
        message: err.message || "Таблица _prisma_migrations не найдена",
      };
    }

    // Проверяем наличие таблицы todos
    const { data: todosExists, error: todosError } = await supabase
      .from("todos")
      .select("id")
      .limit(1);

    return NextResponse.json(
      {
        success: isConnected,
        message: isConnected
          ? "Соединение с базой данных установлено"
          : "Ошибка при подключении к базе данных",
        database: {
          connected: isConnected,
          tables: {
            todos: {
              exists: !todosError,
              error: todosError ? todosError.message : null,
            },
            migrations: {
              exists: !systemError,
              error: systemError ? systemError.message : null,
            },
          },
        },
      },
      { status: isConnected ? 200 : 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при проверке состояния базы данных",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
