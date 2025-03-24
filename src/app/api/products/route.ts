import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { generateEAN13 } from "@/utils/barcode";
import { uploadFiles } from "@/lib/upload";

// Добавление нового товара
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const quantity = formData.get("quantity") as string;
    const description = (formData.get("description") as string) || null;
    const price = (formData.get("price") as string) || null;
    const category = (formData.get("category") as string) || null;

    // Обработка файлов
    const files: File[] = [];
    const photoEntries = formData.getAll("photos");

    for (const photoEntry of photoEntries) {
      if (photoEntry instanceof File && photoEntry.size > 0) {
        files.push(photoEntry);
      }
    }

    // Генерация уникального штрихкода
    let barcode = generateEAN13("200");
    let isUnique = false;

    while (!isUnique) {
      const result = await pool.query(
        "SELECT * FROM products WHERE barcode = $1",
        [barcode]
      );
      if (result.rows.length === 0) isUnique = true;
      else barcode = generateEAN13("200");
    }

    // Загрузка файлов
    const photoPaths = files.length > 0 ? await uploadFiles(files) : [];

    // Добавление товара в базу данных
    await pool.query(
      "INSERT INTO products (name, quantity, barcode, photo_paths, description, price, category) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        name,
        quantity ? parseInt(quantity, 10) : null,
        barcode,
        JSON.stringify(photoPaths),
        description,
        price ? parseFloat(price) : null,
        category,
      ]
    );

    return NextResponse.json(
      {
        message: `Товар добавлен с артикулом: ${barcode}`,
        barcode: barcode,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ошибка при добавлении товара:", error);
    return NextResponse.json(
      {
        error: "Ошибка при добавлении товара",
      },
      { status: 500 }
    );
  }
}

// Получение списка всех товаров
export async function GET() {
  try {
    const result = await pool.query("SELECT * FROM products");

    const products = await Promise.all(
      result.rows.map(async (row) => {
        const photoPaths = JSON.parse(row.photo_paths || "[]");

        // Получаем информацию о коробках, в которых находится товар
        const boxesResult = await pool.query(
          "SELECT b.barcode, b.name " +
            "FROM box_items bi JOIN boxes b ON bi.box_id = b.id " +
            "WHERE bi.product_id = $1",
          [row.id]
        );

        const boxes = boxesResult.rows.map((box) => ({
          barcode: box.barcode,
          name: box.name,
        }));

        return {
          ...row,
          photo_paths: photoPaths,
          boxes,
        };
      })
    );

    return NextResponse.json(products);
  } catch (error) {
    console.error("Ошибка при получении списка товаров:", error);
    return NextResponse.json(
      {
        error: "Ошибка при получении списка товаров",
      },
      { status: 500 }
    );
  }
}
