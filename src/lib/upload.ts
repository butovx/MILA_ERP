import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

/**
 * Загружает файл в хранилище
 * Если есть настроенный Vercel Blob - используем его
 * Иначе сохраняем файл локально в директорию public/uploads
 */
export async function uploadFile(file: File): Promise<string> {
  try {
    const fileExtension = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExtension}`;

    // Проверяем наличие корректного токена Vercel Blob
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const isValidToken =
      blobToken &&
      blobToken.startsWith("vercel_blob_rw_") &&
      blobToken.length > 20 &&
      !blobToken.includes("YOUR_TOKEN");

    if (isValidToken) {
      try {
        // Если токен валидный, используем Vercel Blob
        const blob = await put(fileName, file, {
          access: "public",
          addRandomSuffix: false,
        });

        return blob.url;
      } catch (blobError: any) {
        console.warn("Ошибка Vercel Blob:", blobError.message);
        console.warn("Переключаюсь на локальное хранение файлов");
        // Если возникла ошибка с Vercel Blob, переходим к локальному хранению
      }
    }

    // Если токена нет или возникла ошибка, сохраняем локально
    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    // Создаем директорию для загрузок, если она не существует
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`Создана директория для загрузок: ${uploadsDir}`);
    }

    // Проверяем права на запись
    try {
      fs.accessSync(uploadsDir, fs.constants.W_OK);
    } catch (err) {
      console.error(`Нет прав на запись в директорию ${uploadsDir}:`, err);
      // Пытаемся исправить права
      try {
        fs.chmodSync(uploadsDir, 0o777);
        console.log(`Права доступа изменены для ${uploadsDir}`);
      } catch (chmodErr) {
        console.error(`Не удалось изменить права доступа:`, chmodErr);
      }
    }

    // Сохраняем файл
    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    console.log(`Файл сохранен: ${filePath}`);

    // Возвращаем URL к файлу
    return `/uploads/${fileName}`;
  } catch (error: any) {
    console.error("Ошибка при загрузке файла:", error);
    throw new Error(
      "Ошибка при загрузке файла: " + (error.message || "Неизвестная ошибка")
    );
  }
}

/**
 * Загружает несколько файлов в хранилище
 */
export async function uploadFiles(files: File[]): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadFile(file));
  return Promise.all(uploadPromises);
}

/**
 * Удаляет файл из хранилища
 * @param filePath Путь к файлу (относительный или полный URL)
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    // Если путь начинается с http, это Vercel Blob
    if (filePath.startsWith("http")) {
      // Тут должна быть логика удаления из Vercel Blob
      // В текущей версии @vercel/blob нет прямого метода для удаления
      console.warn("Удаление из Vercel Blob не реализовано");
      return false;
    }

    // Если это локальный файл
    if (filePath.startsWith("/uploads/")) {
      const fileName = path.basename(filePath);
      const fullPath = path.join(process.cwd(), "public", "uploads", fileName);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Файл удален: ${fullPath}`);
        return true;
      } else {
        console.warn(`Файл ${fullPath} не найден`);
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error("Ошибка при удалении файла:", error);
    return false;
  }
}

/**
 * Удаляет неиспользуемые файлы
 * @param usedPaths Массив используемых путей к файлам
 */
export async function deleteUnusedFiles(): Promise<{
  deleted: number;
  errors: number;
}> {
  try {
    // Получаем все пути к файлам из базы данных
    const pool = (await import("@/lib/db")).default;
    const result = await pool.query("SELECT photo_paths FROM products");

    // Собираем все используемые пути
    const usedPaths = new Set<string>();
    result.rows.forEach((row) => {
      const paths = JSON.parse(row.photo_paths || "[]");
      paths.forEach((path: string) => usedPaths.add(path));
    });

    // Получаем список всех файлов в папке uploads
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      return { deleted: 0, errors: 0 };
    }

    const files = fs.readdirSync(uploadsDir);
    let deleted = 0;
    let errors = 0;

    // Удаляем файлы, которые не используются
    for (const file of files) {
      const filePath = `/uploads/${file}`;
      if (!usedPaths.has(filePath)) {
        try {
          fs.unlinkSync(path.join(uploadsDir, file));
          deleted++;
        } catch (error) {
          console.error(`Ошибка при удалении файла ${file}:`, error);
          errors++;
        }
      }
    }

    return { deleted, errors };
  } catch (error) {
    console.error("Ошибка при удалении неиспользуемых файлов:", error);
    return { deleted: 0, errors: 1 };
  }
}
