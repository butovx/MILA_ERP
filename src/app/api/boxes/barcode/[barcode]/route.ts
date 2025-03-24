import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

interface Params {
  params: {
    barcode: string;
  };
}

// GET /api/boxes/barcode/[barcode] - получить коробку по штрихкоду
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const barcode = (await params).barcode;

    // Валидация штрихкода
    if (!barcode) {
      return NextResponse.json(
        { error: "Требуется штрихкод" },
        { status: 400 }
      );
    }

    // Получаем информацию о коробке
    const boxResult = await pool.query(
      `SELECT * FROM boxes WHERE barcode = $1`,
      [barcode]
    );

    if (boxResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Коробка не найдена" },
        { status: 404 }
      );
    }

    const box = boxResult.rows[0];

    // Получаем содержимое коробки
    const itemsResult = await pool.query(
      `SELECT bi.*, p.name, p.barcode, p.photo_paths, p.description, p.price, p.category 
       FROM box_items bi 
       JOIN products p ON bi.product_id = p.id 
       WHERE bi.box_id = $1`,
      [box.id]
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
    console.error("Ошибка при получении коробки по штрихкоду:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
