import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { generateEAN13 } from "@/utils/barcode";

// Получение списка всех коробок
export async function GET() {
  try {
    const result = await pool.query("SELECT * FROM boxes ORDER BY id DESC");
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Ошибка при получении списка коробок:", error);
    return NextResponse.json(
      { error: "Ошибка при получении списка коробок" },
      { status: 500 }
    );
  }
}

// Создание новой коробки
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Название коробки не может быть пустым" },
        { status: 400 }
      );
    }

    // Генерация уникального штрихкода
    let barcode = generateEAN13("300");
    let isUnique = false;

    while (!isUnique) {
      const result = await pool.query(
        "SELECT * FROM boxes WHERE barcode = $1",
        [barcode]
      );
      if (result.rows.length === 0) isUnique = true;
      else barcode = generateEAN13("300");
    }

    // Создание коробки
    const result = await pool.query(
      "INSERT INTO boxes (name, barcode) VALUES ($1, $2) RETURNING *",
      [name, barcode]
    );

    const newBox = result.rows[0];

    return NextResponse.json(
      {
        message: "Коробка успешно создана",
        barcode: newBox.barcode,
        box: newBox,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ошибка при создании коробки:", error);
    return NextResponse.json(
      { error: "Ошибка при создании коробки" },
      { status: 500 }
    );
  }
}
