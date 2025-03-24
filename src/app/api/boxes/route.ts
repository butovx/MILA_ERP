import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { generateEAN13 } from "@/utils/barcode";

// Получение списка всех коробок
export async function GET() {
  try {
    // Сначала получаем все коробки
    const boxesResult = await pool.query(
      "SELECT * FROM boxes ORDER BY id DESC"
    );
    const boxes = boxesResult.rows;

    // Затем для каждой коробки получаем информацию о товарах
    const boxesWithInfo = await Promise.all(
      boxes.map(async (box) => {
        try {
          // Получаем количество товаров в коробке
          const itemsCountResult = await pool.query(
            "SELECT COUNT(*) as count FROM box_items WHERE box_id = $1",
            [box.id]
          );
          const itemsCount = parseInt(
            itemsCountResult.rows[0]?.count || "0",
            10
          );

          // Получаем общую стоимость товаров в коробке
          const totalPriceResult = await pool.query(
            `
            SELECT COALESCE(SUM(p.price * bi.quantity), 0) as total
            FROM box_items bi
            LEFT JOIN products p ON bi.product_id = p.id
            WHERE bi.box_id = $1
          `,
            [box.id]
          );
          const totalPrice = parseFloat(totalPriceResult.rows[0]?.total || "0");

          return {
            ...box,
            items_count: itemsCount,
            total_price: totalPrice,
          };
        } catch (err) {
          console.error(
            `Ошибка при получении информации для коробки ${box.id}:`,
            err
          );
          // В случае ошибки при получении дополнительной информации
          // возвращаем коробку с дефолтными значениями
          return {
            ...box,
            items_count: 0,
            total_price: 0,
          };
        }
      })
    );

    return NextResponse.json(boxesWithInfo);
  } catch (error) {
    console.error("Ошибка при получении списка коробок:", error);
    // Более подробный вывод ошибки
    if (error instanceof Error) {
      console.error("Сообщение ошибки:", error.message);
      console.error("Стек ошибки:", error.stack);
    }
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
