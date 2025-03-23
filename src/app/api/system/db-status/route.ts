import { NextRequest, NextResponse } from "next/server";
import {
  verifyDatabaseConnection,
  verifyDatabaseSchema,
} from "@/utils/verify-db";

// GET /api/system/db-status - проверка статуса подключения к базе данных
export async function GET(request: NextRequest) {
  try {
    // Проверяем подключение к базе данных
    const connectionStatus = await verifyDatabaseConnection();

    // Если подключение успешно, проверяем схему
    let schemaStatus = {
      success: false,
      message: "Проверка схемы не выполнена",
    };
    if (connectionStatus.success) {
      schemaStatus = await verifyDatabaseSchema();
    }

    // Формируем ответ
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      connection: connectionStatus,
      schema: schemaStatus,
      environment: {
        useSupabase: process.env.USE_SUPABASE === "true",
        nodeEnv: process.env.NODE_ENV,
      },
    });
  } catch (error: any) {
    console.error("Ошибка при проверке статуса базы данных:", error);
    return NextResponse.json(
      {
        error: "Ошибка при проверке статуса базы данных",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
