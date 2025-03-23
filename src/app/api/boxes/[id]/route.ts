import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// Получение информации о коробке по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const result = await pool.query("SELECT * FROM boxes WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Коробка не найдена" },
        { status: 404 }
      );
    }

    const box = result.rows[0];

    // Получаем содержимое коробки
    const itemsResult = await pool.query(
      `SELECT bi.*, p.name, p.barcode, p.photo_paths, p.description, p.price, p.category 
       FROM box_items bi 
       JOIN products p ON bi.product_id = p.id 
       WHERE bi.box_id = $1`,
      [id]
    );

    const items = itemsResult.rows.map((row) => {
      return {
        ...row,
        photo_paths: JSON.parse(row.photo_paths || "[]"),
      };
    });

    box.items = items;

    return NextResponse.json(box);
  } catch (error) {
    console.error("Ошибка при получении коробки:", error);
    return NextResponse.json(
      { error: "Ошибка при получении коробки" },
      { status: 500 }
    );
  }
}

// Обновление коробки
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { name } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Название коробки не может быть пустым" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "UPDATE boxes SET name = $1 WHERE id = $2 RETURNING *",
      [name, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Коробка не найдена" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Коробка успешно обновлена",
      box: result.rows[0],
    });
  } catch (error) {
    console.error("Ошибка при обновлении коробки:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении коробки" },
      { status: 500 }
    );
  }
}

// Удаление коробки
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Проверяем, есть ли товары в коробке
    const boxItemsResult = await pool.query(
      "SELECT * FROM box_items WHERE box_id = $1",
      [id]
    );

    if (boxItemsResult.rows.length > 0) {
      // Удаляем все товары из коробки
      await pool.query("DELETE FROM box_items WHERE box_id = $1", [id]);
    }

    // Удаляем коробку
    const result = await pool.query(
      "DELETE FROM boxes WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Коробка не найдена" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Коробка успешно удалена",
    });
  } catch (error) {
    console.error("Ошибка при удалении коробки:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении коробки" },
      { status: 500 }
    );
  }
}
