import { NextRequest, NextResponse } from "next/server";
import { generateBarcodeImage } from "@/utils/barcode";

// Генерация и получение изображения штрихкода
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Не указан штрихкод" },
        { status: 400 }
      );
    }

    // Проверка длины штрихкода для формата EAN13
    if (code.length !== 13) {
      return NextResponse.json(
        { error: "Неверный формат штрихкода. Должен быть EAN13 (13 цифр)" },
        { status: 400 }
      );
    }

    // Генерируем изображение штрихкода
    const barcodeImage = await generateBarcodeImage(code);

    // Возвращаем изображение штрихкода
    return new NextResponse(barcodeImage, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="barcode-${code}.png"`,
      },
    });
  } catch (error) {
    console.error("Ошибка при генерации штрихкода:", error);
    return NextResponse.json(
      { error: "Ошибка при генерации штрихкода" },
      { status: 500 }
    );
  }
}
