import { NextResponse } from "next/server";
import { runMigrations, checkDbConnection } from "@/lib/migrations";

export async function GET() {
  // Проверяем соединение с базой данных
  const isConnected = await checkDbConnection();

  if (!isConnected) {
    return NextResponse.json(
      { success: false, message: "Ошибка при подключении к базе данных" },
      { status: 500 }
    );
  }

  // Запускаем миграции
  const success = await runMigrations();

  if (success) {
    return NextResponse.json(
      { success: true, message: "Миграции успешно выполнены" },
      { status: 200 }
    );
  } else {
    return NextResponse.json(
      { success: false, message: "Ошибка при выполнении миграций" },
      { status: 500 }
    );
  }
}
