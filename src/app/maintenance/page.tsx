"use client";

import { useState } from "react";
import { H1, H2, Text } from "@/components/Typography";
import { TrashIcon, CheckIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function MaintenancePage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    errorMessage?: string;
    deleted?: number;
    errors?: number;
  } | null>(null);

  const cleanUnusedImages = async () => {
    if (
      !confirm("Вы уверены, что хотите удалить все неиспользуемые изображения?")
    ) {
      return;
    }

    setIsDeleting(true);
    setResult(null);

    try {
      const response = await fetch("/api/maintenance/clean-uploads", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          errorMessage: data.errorMessage,
          deleted: data.deleted,
          errors: data.errors,
        });

        toast.success({
          title: "Успешно",
          description: `Удалено файлов: ${data.deleted}${
            data.errors ? `, с ошибками: ${data.errors}` : ""
          }`,
        });
      } else {
        setResult({
          success: false,
          message:
            data.error || "Произошла ошибка при очистке неиспользуемых файлов",
        });

        toast.error({
          title: "Ошибка",
          description:
            data.error || "Произошла ошибка при очистке неиспользуемых файлов",
        });
      }
    } catch (error) {
      console.error("Ошибка при отправке запроса:", error);
      setResult({
        success: false,
        message: "Произошла ошибка при отправке запроса",
      });

      toast.error({
        title: "Ошибка",
        description: "Произошла ошибка при отправке запроса",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="py-8">
      <div className="mb-8">
        <H1>Управление системой</H1>
        <Text className="text-gray-600">
          Инструменты для обслуживания и оптимизации работы системы
        </Text>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Управление файлами</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg p-4 bg-gray-50 border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
              <div>
                <h3 className="text-lg font-medium">
                  Очистка неиспользуемых изображений
                </h3>
                <p className="text-gray-600">
                  Удаляет все изображения, которые не используются ни одним
                  товаром
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={cleanUnusedImages}
                disabled={isDeleting}
                className="self-start"
              >
                {isDeleting ? (
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <TrashIcon className="h-4 w-4 mr-2" />
                )}
                Очистить
              </Button>
            </div>

            {result && (
              <div
                className={`p-4 rounded-md ${
                  result.success
                    ? "bg-green-50 text-green-900 border border-green-200"
                    : "bg-red-50 text-red-900 border border-red-200"
                }`}
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    {result.success ? (
                      <CheckIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <svg
                        className="h-5 w-5 text-red-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{result.message}</p>
                    {result.success && result.deleted !== undefined && (
                      <p className="mt-2 text-sm">
                        Удалено файлов: {result.deleted}
                        {result.errors ? `, с ошибками: ${result.errors}` : ""}
                      </p>
                    )}
                    {result.errorMessage && (
                      <p className="mt-1 text-sm text-red-800">
                        {result.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Системная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <h3 className="text-lg font-medium mb-2">Версия системы</h3>
              <p className="text-gray-600">MILA ERP 1.0.0</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <h3 className="text-lg font-medium mb-2">Дата установки</h3>
              <p className="text-gray-600">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
