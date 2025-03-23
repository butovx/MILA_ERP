import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// PUT /api/box-items/[boxId]/[productId] - обновить количество товара в коробке
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ boxId: string; productId: string }> }
) {
  try {
    const { boxId, productId } = await params;
    const { quantity } = await request.json();

    // Валидация входных данных
    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Количество должно быть больше 0" },
        { status: 400 }
      );
    }

    // Проверяем существование записи
    const existingItemResult = await pool.query(
      "SELECT * FROM box_items WHERE box_id = $1 AND product_id = $2",
      [boxId, productId]
    );

    if (existingItemResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Товар не найден в этой коробке" },
        { status: 404 }
      );
    }

    // Обновляем количество товара
    const updatedItem = await pool.query(
      "UPDATE box_items SET quantity = $1 WHERE box_id = $2 AND product_id = $3 RETURNING *",
      [quantity, boxId, productId]
    );

    return NextResponse.json({
      message: "Количество товара обновлено",
      item: updatedItem.rows[0],
    });
  } catch (error) {
    console.error("Ошибка при обновлении количества товара:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// DELETE /api/box-items/[boxId]/[productId] - удалить товар из коробки
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boxId: string; productId: string }> }
) {
  try {
    const { boxId, productId } = await params;

    // Проверяем существование записи
    const existingItemResult = await pool.query(
      "SELECT * FROM box_items WHERE box_id = $1 AND product_id = $2",
      [boxId, productId]
    );

    if (existingItemResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Товар не найден в этой коробке" },
        { status: 404 }
      );
    }

    // Удаляем товар из коробки
    await pool.query(
      "DELETE FROM box_items WHERE box_id = $1 AND product_id = $2",
      [boxId, productId]
    );

    return NextResponse.json({
      message: "Товар удален из коробки",
    });
  } catch (error) {
    console.error("Ошибка при удалении товара из коробки:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
