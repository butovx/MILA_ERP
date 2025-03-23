import { createCanvas } from "canvas";
import bwipjs from "bwip-js";

/**
 * Генерирует случайный штрихкод EAN13 с заданным префиксом.
 *
 * @param prefix Префикс штрихкода (обычно код страны, например "460" для России)
 * @returns Сгенерированный штрихкод EAN13
 */
export function generateEAN13(prefix: string = "460"): string {
  // Проверяем, чтобы префикс не превышал 12 цифр
  if (prefix.length >= 12) {
    prefix = prefix.substring(0, 11);
  }

  // Генерируем случайные цифры для дополнения до 12 цифр
  let code = prefix;
  const randomDigitsCount = 12 - prefix.length;

  for (let i = 0; i < randomDigitsCount; i++) {
    code += Math.floor(Math.random() * 10);
  }

  // Рассчитываем контрольную цифру
  let checksum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i]);
    checksum += i % 2 === 0 ? digit : digit * 3;
  }

  const checksumDigit = (10 - (checksum % 10)) % 10;

  return code + checksumDigit;
}

/**
 * Генерирует изображение штрихкода в формате PNG.
 *
 * @param code Штрихкод для генерации изображения
 * @returns Promise с буфером изображения в формате PNG
 */
export async function generateBarcodeImage(code: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: "ean13", // Тип штрихкода
        text: code, // Текст для кодирования
        scale: 3, // Масштаб изображения
        height: 10, // Высота штрихкода
        includetext: true, // Показать текст штрихкода
        textxalign: "center", // Выравнивание текста
        backgroundcolor: "FFFFFF", // Белый фон
      },
      function (err: Error | null, buffer: Buffer) {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      }
    );
  });
}
