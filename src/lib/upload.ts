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
    }

    // Сохраняем файл
    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

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
