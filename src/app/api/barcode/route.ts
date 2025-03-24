import { NextRequest, NextResponse } from "next/server";
import { generateBarcodeImage } from "@/utils/barcode";

// Генерация и получение изображения штрихкода
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return new NextResponse("Barcode is required", { status: 400 });
  }

  try {
    console.log("Generating barcode for code:", code); // Логирование

    // Проверка длины штрихкода для формата EAN13
    if (code.length !== 13) {
      return NextResponse.json(
        { error: "Неверный формат штрихкода. Должен быть EAN13 (13 цифр)" },
        { status: 400 }
      );
    }

    // Генерируем изображение штрихкода с использованием JsBarcode
    const barcodeImage = await generateBarcodeImage(code);

    // Возвращаем изображение штрихкода
    return new NextResponse(barcodeImage, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="barcode-${code}.png"`,
      },
    });
  } catch (error) {
    console.error("Error generating barcode:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
