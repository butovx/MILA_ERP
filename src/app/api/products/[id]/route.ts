import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { uploadFiles } from "@/lib/upload";

interface Params {
  params: {
    id: string;
  };
}

// Получение информации о товаре по ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = (await params).id;

    const result = await pool.query("SELECT * FROM products WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    const product = result.rows[0];
    product.photo_paths = JSON.parse(product.photo_paths || "[]");

    // Получаем информацию о коробках, в которых находится товар
    const boxesResult = await pool.query(
      "SELECT b.id, b.barcode, b.name " +
        "FROM box_items bi JOIN boxes b ON bi.box_id = b.id " +
        "WHERE bi.product_id = $1",
      [id]
    );

    product.boxes = boxesResult.rows;

    return NextResponse.json(product);
  } catch (error) {
    console.error("Ошибка при получении товара:", error);
    return NextResponse.json(
      { error: "Ошибка при получении товара" },
      { status: 500 }
    );
  }
}

// Обновление товара
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const id = (await params).id;
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const quantity = formData.get("quantity") as string;
    const description = (formData.get("description") as string) || null;
    const price = (formData.get("price") as string) || null;
    const category = (formData.get("category") as string) || null;

    // Проверяем существование товара
    const checkResult = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [id]
    );
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    // Обработка файлов
    const files: File[] = [];
    const photoEntries = formData.getAll("photos");

    for (const photoEntry of photoEntries) {
      if (photoEntry instanceof File && photoEntry.size > 0) {
        files.push(photoEntry);
      }
    }

    // Получаем текущие фотографии
    const currentProduct = checkResult.rows[0];
    let photoPaths = JSON.parse(currentProduct.photo_paths || "[]");

    // Если есть новые фотографии, загружаем их и добавляем к существующим
    if (files.length > 0) {
      const newPhotoPaths = await uploadFiles(files);
      photoPaths = [...photoPaths, ...newPhotoPaths];
    }

    // Обновляем товар в базе данных
    await pool.query(
      `UPDATE products SET 
       name = $1, 
       quantity = $2, 
       photo_paths = $3, 
       description = $4, 
       price = $5, 
       category = $6
       WHERE id = $7`,
      [
        name,
        quantity ? parseInt(quantity, 10) : null,
        JSON.stringify(photoPaths),
        description,
        price ? parseFloat(price) : null,
        category,
        id,
      ]
    );

    return NextResponse.json({
      message: "Товар успешно обновлен",
    });
  } catch (error) {
    console.error("Ошибка при обновлении товара:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении товара" },
      { status: 500 }
    );
  }
}

// Удаление товара
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const id = (await params).id;

    // Проверяем, есть ли товар в коробках
    const boxItemsResult = await pool.query(
      "SELECT * FROM box_items WHERE product_id = $1",
      [id]
    );

    if (boxItemsResult.rows.length > 0) {
      // Удаляем товар из всех коробок
      await pool.query("DELETE FROM box_items WHERE product_id = $1", [id]);
    }

    // Удаляем товар
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Товар успешно удален",
    });
  } catch (error) {
    console.error("Ошибка при удалении товара:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении товара" },
      { status: 500 }
    );
  }
}
