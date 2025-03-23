import { NextRequest, NextResponse } from "next/server";
import pool, { Pool } from "@/lib/db";
import { generateEAN13 } from "@/utils/barcode";
import { uploadFiles } from "@/lib/upload";
import https from "https";
import { Client } from "pg";

// Функция для выполнения запроса с различными стратегиями
async function executeWithFallback(query: string, params: any[] = []) {
  try {
    // Первая попытка: используем стандартный пул
    console.log("[Стратегия 1] Использование пула");
    const result = await pool.query(query, params);
    return result;
  } catch (poolError: any) {
    console.error("[Стратегия 1] Ошибка:", poolError.message);

    // Вторая попытка: Создаем одноразовый пул с явными SSL-настройками
    try {
      console.log(
        "[Стратегия 2] Создание нового пула с явными настройками SSL"
      );
      const directPool = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      });

      const result = await directPool.query(query, params);
      // После успешного запроса закрываем пул
      await directPool.end();
      return result;
    } catch (directPoolError: any) {
      console.error("[Стратегия 2] Ошибка:", directPoolError.message);

      // Третья попытка: Используем Client вместо Pool
      try {
        console.log("[Стратегия 3] Создание нового pg.Client");
        const client = new Client({
          connectionString: process.env.POSTGRES_URL,
          ssl: {
            rejectUnauthorized: false,
          },
        });

        await client.connect();
        const result = await client.query(query, params);
        await client.end();
        return result;
      } catch (clientError: any) {
        console.error("[Стратегия 3] Ошибка:", clientError.message);

        // Если все стратегии не сработали, выбрасываем оригинальную ошибку
        throw poolError;
      }
    }
  }
}

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
      const result = await executeWithFallback(
        "SELECT * FROM products WHERE barcode = $1",
        [barcode]
      );
      if (result.rows.length === 0) isUnique = true;
      else barcode = generateEAN13("200");
    }

    // Загрузка файлов
    const photoPaths = files.length > 0 ? await uploadFiles(files) : [];

    // Добавление товара в базу данных
    await executeWithFallback(
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
    console.log(
      "Запрос списка товаров через обновленный API с несколькими стратегиями"
    );

    // Используем функцию с несколькими стратегиями выполнения
    const result = await executeWithFallback(
      "SELECT * FROM products ORDER BY updated_at DESC"
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Все стратегии запроса списка товаров не удались:", error);

    // Возвращаем подробную информацию об ошибке для отладки
    return NextResponse.json(
      {
        error: `Все стратегии выполнения запроса не удались: ${error.message}`,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
