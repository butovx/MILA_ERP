import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase";

// GET /api/todos - получить все задачи
export async function GET(request: NextRequest) {
  try {
    // Получение всех задач из таблицы todos
    const { data, error } = await supabase.from("todos").select();

    if (error) {
      console.error("Ошибка при получении задач:", error);
      return NextResponse.json(
        { error: "Ошибка при получении задач" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Непредвиденная ошибка:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// POST /api/todos - создать новую задачу
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Проверка наличия необходимых полей
    if (!body.title) {
      return NextResponse.json(
        { error: "Название задачи обязательно" },
        { status: 400 }
      );
    }

    // Вставка новой задачи
    const { data, error } = await supabase
      .from("todos")
      .insert([
        {
          title: body.title,
          completed: body.completed || false,
          description: body.description || null,
        },
      ])
      .select();

    if (error) {
      console.error("Ошибка при создании задачи:", error);
      return NextResponse.json(
        { error: "Ошибка при создании задачи" },
        { status: 500 }
      );
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Непредвиденная ошибка:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
