import { NextRequest, NextResponse } from "next/server";
import { deleteUnusedFiles } from "@/lib/upload";

/**
 * API-эндпоинт для удаления неиспользуемых файлов изображений
 * POST /api/maintenance/clean-uploads
 */
export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию (в будущем можно добавить проверку админских прав)
    // const session = await getSession({ req: request });
    // if (!session || !session.user.isAdmin) {
    //   return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    // }

    // Удаляем неиспользуемые файлы
    const result = await deleteUnusedFiles();

    return NextResponse.json({
      message: `Удалено ${result.deleted} неиспользуемых файлов`,
      errorMessage:
        result.errors > 0
          ? `Возникло ${result.errors} ошибок при удалении`
          : null,
      deleted: result.deleted,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Ошибка при удалении неиспользуемых файлов:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении неиспользуемых файлов" },
      { status: 500 }
    );
  }
}
