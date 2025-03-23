import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase";
import { supabaseUrl, supabaseKey } from "@/lib/supabase";

/**
 * Выполняет SQL-запрос напрямую через Supabase
 * ВАЖНО: Этот эндпоинт должен быть защищен от несанкционированного доступа
 */
export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации (в будущем здесь должна быть проверка на админа)
    // TODO: Реализовать проверку аутентификации и авторизации

    // Получаем SQL-запрос из тела запроса
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Не указан SQL-запрос или указан в неверном формате",
        },
        { status: 400 }
      );
    }

    console.log("Выполняем SQL-запрос:", query);

    // Сначала пробуем выполнить через RPC
    try {
      const { data, error } = await supabase.rpc("exec_sql", { query });

      if (!error) {
        return NextResponse.json({
          success: true,
          message: "Запрос успешно выполнен через RPC",
          result: data,
        });
      }

      console.log(
        "RPC функция exec_sql недоступна, используем REST API",
        error
      );
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
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          success: false,
          message: "Ошибка при выполнении SQL-запроса",
          error: errorData,
        },
        { status: 500 }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "Запрос успешно выполнен через REST API",
      result,
    });
  } catch (error: any) {
    console.error("Ошибка при выполнении SQL-запроса:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
