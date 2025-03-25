import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { deleteFile } from "@/lib/upload";

interface Params {
  params: {
    id: string;
  };
}

// DELETE /api/products/[id]/photo - удалить фотографию товара
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const id = (await params).id;
    const { photoPath } = await request.json();

    if (!photoPath) {
      return NextResponse.json(
        { error: "Путь к фотографии не указан" },
        { status: 400 }
      );
    }

    // Проверяем существование товара
    const checkResult = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    // Получаем текущие фотографии
    const currentProduct = checkResult.rows[0];
    let photoPaths = JSON.parse(currentProduct.photo_paths || "[]");

    // Проверяем, существует ли фотография в массиве
    if (!photoPaths.includes(photoPath)) {
      return NextResponse.json(
        { error: "Фотография не найдена" },
        { status: 404 }
      );
    }

    // Удаляем фотографию из массива
    photoPaths = photoPaths.filter((path: string) => path !== photoPath);

    // Обновляем товар в базе данных
    await pool.query("UPDATE products SET photo_paths = $1 WHERE id = $2", [
      JSON.stringify(photoPaths),
      id,
    ]);

    // Удаляем файл физически
    await deleteFile(photoPath);

    return NextResponse.json({
      message: "Фотография успешно удалена",
    });
  } catch (error) {
    console.error("Ошибка при удалении фотографии:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении фотографии" },
      { status: 500 }
    );
  }
}
