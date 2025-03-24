"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  EyeIcon,
  TrashIcon,
  PlusIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import { Box } from "@/types";
import Barcode from "@/components/Barcode";

export default function BoxesPage() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boxName, setBoxName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  useEffect(() => {
    fetchBoxes();
  }, []);

  const fetchBoxes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/boxes");
      if (!response.ok) {
        throw new Error("Ошибка при получении данных");
      }
      const data = await response.json();
      setBoxes(data);
    } catch (err) {
      setError("Не удалось загрузить список коробок");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBox = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!boxName.trim()) {
      setCreateResult({ success: false, message: "Введите название коробки" });
      return;
    }

    setCreating(true);
    setCreateResult(null);

    try {
      const response = await fetch("/api/boxes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: boxName }),
      });

      const result = await response.json();

      if (response.ok) {
        setCreateResult({
          success: true,
          message: `Коробка создана с артикулом: ${result.barcode}`,
        });
        setBoxName("");
        fetchBoxes(); // Обновляем список коробок
      } else {
        setCreateResult({
          success: false,
          message: result.error || "Ошибка при создании коробки",
        });
      }
    } catch (error) {
      setCreateResult({
        success: false,
        message: "Произошла ошибка при отправке формы",
      });
      console.error("Ошибка при отправке формы:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBox = async (id: number) => {
    if (!confirm("Вы действительно хотите удалить эту коробку?")) return;

    try {
      const response = await fetch(`/api/boxes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Удаляем коробку из списка
        setBoxes(boxes.filter((b) => b.id !== id));
      } else {
        const data = await response.json();
        alert(data.error || "Ошибка при удалении коробки");
      }
    } catch (error) {
      console.error("Ошибка при удалении коробки:", error);
      alert("Произошла ошибка при удалении коробки");
    }
  };

  const copyBarcodeToClipboard = (barcode: string) => {
    navigator.clipboard
      .writeText(barcode)
      .then(() => {
        alert(`Штрихкод ${barcode} скопирован в буфер обмена`);
      })
      .catch((err) => {
        console.error("Ошибка при копировании:", err);
      });
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p className="mt-2 text-gray-600">Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <h2 className="text-red-800 font-medium">Ошибка</h2>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-6">Управление коробками</h1>

      {/* Список коробок */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Список коробок</h2>

        {boxes.length === 0 ? (
          <p className="text-gray-500">Нет доступных коробок</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Штрихкод
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Название
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {boxes.map((box) => (
                  <tr key={box.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-mono mb-1">
                          {box.barcode}
                        </div>
                        <Barcode
                          value={box.barcode}
                          height={50}
                          width={1}
                          fontSize={12}
                          margin={5}
                          className="max-w-full"
                          textMargin={3}
                        />
                        <button
                          onClick={() => copyBarcodeToClipboard(box.barcode)}
                          className="mt-1 text-gray-400 hover:text-gray-600 self-start"
                          title="Копировать штрихкод"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {box.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <Link
                          href={`/box-content?id=${box.id}`}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Просмотреть содержимое"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteBox(box.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Удалить коробку"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Форма создания коробки */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Создать коробку</h2>

        <form onSubmit={handleCreateBox} className="max-w-md">
          <div className="mb-4">
            <label
              htmlFor="boxName"
              className="block text-sm font-medium text-gray-700"
            >
              Название коробки:
            </label>
            <input
              type="text"
              id="boxName"
              value={boxName}
              onChange={(e) => setBoxName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Введите название коробки"
              required
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {creating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Создание...
              </>
            ) : (
              <>
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Создать
              </>
            )}
          </button>
        </form>

        {createResult && (
          <div
            className={`mt-4 p-3 rounded-md ${
              createResult.success
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {createResult.message}
          </div>
        )}
      </div>
    </div>
  );
}
