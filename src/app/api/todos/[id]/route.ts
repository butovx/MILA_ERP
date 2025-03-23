import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase";

// GET /api/todos/[id] - получить задачу по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Получение задачи по ID
    const { data, error } = await supabase
      .from("todos")
      .select()
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Задача не найдена" },
          { status: 404 }
        );
      }

      console.error("Ошибка при получении задачи:", error);
      return NextResponse.json(
        { error: "Ошибка при получении задачи" },
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

// PATCH /api/todos/[id] - обновить задачу
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Обновление задачи
    const { data, error } = await supabase
      .from("todos")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Задача не найдена" },
          { status: 404 }
        );
      }

      console.error("Ошибка при обновлении задачи:", error);
      return NextResponse.json(
        { error: "Ошибка при обновлении задачи" },
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

// DELETE /api/todos/[id] - удалить задачу
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Удаление задачи
    const { error } = await supabase.from("todos").delete().eq("id", id);

    if (error) {
      console.error("Ошибка при удалении задачи:", error);
      return NextResponse.json(
        { error: "Ошибка при удалении задачи" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Задача успешно удалена" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Непредвиденная ошибка:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
