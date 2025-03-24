import { createCanvas } from "canvas";
import JsBarcode from "jsbarcode";

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

// Форматирует строку EAN-13 в виде "X XXXXXX XXXXXX"
function formatEAN13(code: string): string {
  if (code.length !== 13) return code;
  return `${code.substring(0, 1)} ${code.substring(1, 7)} ${code.substring(7)}`;
}

/**
 * Генерирует изображение штрихкода в формате PNG.
 *
 * @param code Штрихкод для генерации изображения
 * @returns Promise с буфером изображения в формате PNG
 */
export async function generateBarcodeImage(code: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = createCanvas(300, 110);

      JsBarcode(canvas, code, {
        format: "EAN13",
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 16,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000",
      });

      const ctx = canvas.getContext("2d");

      if (code.length === 13) {
        // Очищаем область, где был стандартный текст
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 70, canvas.width, 30);

        // Рисуем форматированный текст
        ctx.fillStyle = "#000000";
        ctx.textBaseline = "top";
        ctx.font = "14px monospace";
        ctx.textAlign = "center";

        const formattedText = formatEAN13(code);
        ctx.fillText(formattedText, canvas.width / 2, 75);
      }

      const buffer = canvas.toBuffer("image/png");
      resolve(buffer);
    } catch (error) {
      reject(error);
    }
  });
}
