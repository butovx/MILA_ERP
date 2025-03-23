import { NextRequest, NextResponse } from "next/server";

// Указываем, что это Edge Function (выполняется на edge серверах Vercel, которые не имеют SSL проблем)
export const runtime = "edge";

/**
 * Proxy API для Supabase
 * Используем Edge Function, который обходит проблемы с SSL сертификатами
 */
export async function POST(request: NextRequest) {
  try {
    // Получаем данные из запроса
    const body = await request.json();
    const { functionName, params } = body;

    // Проверяем обязательные поля
    if (!functionName) {
      return NextResponse.json(
        { error: "Не указано имя функции" },
        { status: 400 }
      );
    }

    // Получаем URL и ключ Supabase из переменных окружения
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Не настроены переменные окружения Supabase" },
        { status: 500 }
      );
    }

    console.log(`[Edge] Вызов Supabase RPC: ${functionName}`);

    // Выполняем запрос к Supabase из edge функции
    // Edge функции выполняются на серверах Vercel, которые не имеют проблем с SSL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Edge] Ошибка Supabase: ${response.status} ${errorText}`);

      return NextResponse.json(
        { error: `Ошибка Supabase: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    // Получаем данные и возвращаем их
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Edge] Ошибка прокси:", error);

    return NextResponse.json(
      { error: `Ошибка прокси: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
