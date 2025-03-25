"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  EyeIcon,
  TrashIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon,
  PencilIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { Box } from "@/types";
import Barcode from "@/components/Barcode";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import JsBarcode from "jsbarcode";

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
  const [deletingBoxId, setDeletingBoxId] = useState<number | null>(null);
  const [expandedBarcodes, setExpandedBarcodes] = useState<Set<string>>(
    new Set()
  );
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Добавляем состояние для режима выбора
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBoxes, setSelectedBoxes] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [deletingBoxesIds, setDeletingBoxesIds] = useState<number[]>([]);

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
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Не удалось загрузить список коробок",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBox = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!boxName.trim()) {
      toast.warning({
        id: genId(),
        title: "Предупреждение",
        description: "Введите название коробки",
      });
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
        toast.success({
          id: genId(),
          title: "Коробка создана",
          description: `Артикул: ${result.barcode}`,
        });
        setBoxName("");
        fetchBoxes(); // Обновляем список коробок
      } else {
        toast.error({
          id: genId(),
          title: "Ошибка",
          description: result.error || "Ошибка при создании коробки",
        });
      }
    } catch (error) {
      console.error("Ошибка при отправке формы:", error);
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Произошла ошибка при отправке формы",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBox = async (id: number) => {
    if (!confirm("Вы действительно хотите удалить эту коробку?")) return;

    try {
      setDeletingBoxId(id);
      const response = await fetch(`/api/boxes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Удаляем коробку из списка
        setBoxes(boxes.filter((b) => b.id !== id));
        toast.success({
          id: genId(),
          title: "Успешно",
          description: "Коробка удалена",
        });
      } else {
        const data = await response.json();
        toast.error({
          id: genId(),
          title: "Ошибка",
          description: data.error || "Ошибка при удалении коробки",
        });
      }
    } catch (error) {
      console.error("Ошибка при удалении коробки:", error);
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Произошла ошибка при удалении коробки",
      });
    } finally {
      setDeletingBoxId(null);
    }
  };

  const copyBarcodeToClipboard = (barcode: string) => {
    navigator.clipboard
      .writeText(barcode)
      .then(() => {
        toast.success({
          id: genId(),
          title: "Скопировано",
          description: `Штрихкод ${barcode} скопирован в буфер обмена`,
        });
      })
      .catch((err) => {
        console.error("Ошибка при копировании:", err);
        toast.error({
          id: genId(),
          title: "Ошибка",
          description: "Не удалось скопировать штрихкод",
        });
      });
  };

  const toggleBarcode = (barcode: string) => {
    setExpandedBarcodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(barcode)) {
        newSet.delete(barcode);
      } else {
        newSet.add(barcode);
      }
      return newSet;
    });
  };

  const sortedBoxes = useMemo(() => {
    if (!sortConfig) return boxes;

    return [...boxes].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Box];
      const bValue = b[sortConfig.key as keyof Box];

      // Обработка undefined значений
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [boxes, sortConfig]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const genId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  // Функция для скачивания штрихкода
  const downloadBarcode = (barcode: string) => {
    // Создаем временный элемент canvas с компонентом Barcode
    const tempCanvas = document.createElement("canvas");
    tempCanvas.id = `temp-barcode-${barcode}`;
    document.body.appendChild(tempCanvas);

    try {
      JsBarcode(tempCanvas, barcode, {
        format: "EAN13",
        width: 1.5,
        height: 80,
        displayValue: true,
        fontSize: 16,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000",
      });

      // Скачивание штрихкода
      const link = document.createElement("a");
      link.download = `barcode-${barcode}.png`;
      link.href = tempCanvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();

      // Удаляем временные элементы
      document.body.removeChild(link);
      document.body.removeChild(tempCanvas);

      toast.success({
        id: genId(),
        title: "Успешно",
        description: `Штрихкод ${barcode} скачан`,
      });
    } catch (error) {
      console.error("Ошибка при создании штрих-кода:", error);
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Не удалось скачать штрихкод",
      });
    }
  };

  // Добавляем функции для работы с выбранными коробками
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedBoxes([]);
    setIsAllSelected(false);
  };

  const toggleBoxSelection = (boxId: number) => {
    if (selectedBoxes.includes(boxId)) {
      setSelectedBoxes(selectedBoxes.filter((id) => id !== boxId));
    } else {
      setSelectedBoxes([...selectedBoxes, boxId]);
    }
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedBoxes([]);
    } else {
      setSelectedBoxes(boxes.map((box) => box.id));
    }
    setIsAllSelected(!isAllSelected);
  };

  const deleteSelectedBoxes = async () => {
    if (selectedBoxes.length === 0) return;

    if (
      !confirm(
        `Вы действительно хотите удалить выбранные коробки (${selectedBoxes.length} шт.)?\nЭто действие нельзя отменить.`
      )
    ) {
      return;
    }

    setDeletingBoxesIds([...selectedBoxes]);

    try {
      const results = await Promise.all(
        selectedBoxes.map((id) =>
          fetch(`/api/boxes/${id}`, { method: "DELETE" })
        )
      );

      const allSuccessful = results.every((res) => res.ok);

      if (allSuccessful) {
        setBoxes(boxes.filter((b) => !selectedBoxes.includes(b.id)));
        toast.success({
          id: genId(),
          title: "Успешно",
          description: `Удалено ${selectedBoxes.length} коробок`,
        });
        setSelectedBoxes([]);
      } else {
        toast.error({
          id: genId(),
          title: "Ошибка",
          description: "Произошла ошибка при удалении некоторых коробок",
        });
      }
    } catch (error) {
      console.error("Ошибка при удалении коробок:", error);
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Произошла ошибка при удалении коробок",
      });
    } finally {
      setDeletingBoxesIds([]);
    }
  };

  const columns = [
    ...(selectionMode
      ? [
          {
            key: "select",
            header: (
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            ),
            render: (box: Box) => (
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedBoxes.includes(box.id)}
                  onChange={() => toggleBoxSelection(box.id)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            ),
            mobilePriority: 1,
          },
        ]
      : []),
    {
      key: "barcode",
      header: "Штрихкод",
      sortable: true,
      render: (box: Box) => (
        <div className="flex items-center space-x-2">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              downloadBarcode(box.barcode);
            }}
            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            title="Нажмите для скачивания штрихкода"
          >
            {box.barcode}
          </a>
          <button
            onClick={() => copyBarcodeToClipboard(box.barcode)}
            className="text-gray-400 hover:text-gray-600"
            title="Копировать штрихкод"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
          </button>
        </div>
      ),
      mobilePriority: 1,
    },
    {
      key: "name",
      header: "Название",
      sortable: true,
      render: (box: Box) => (
        <Link
          href={`/box-content?barcode=${box.barcode}`}
          className="text-blue-600 hover:text-blue-800 hover:underline"
          title={box.name}
        >
          {box.name}
        </Link>
      ),
      mobilePriority: 1,
    },
    {
      key: "items_count",
      header: "Товаров",
      sortable: true,
      render: (box: Box) => (
        <div className="text-left font-medium">{box.items_count || 0}</div>
      ),
      mobilePriority: 2,
    },
    {
      key: "total_price",
      header: "Стоимость",
      sortable: true,
      render: (box: Box) => (
        <div className="text-left font-medium">
          {box.total_price
            ? `${Math.round(box.total_price).toLocaleString("ru-RU")} ₽`
            : "0 ₽"}
        </div>
      ),
      mobilePriority: 2,
    },
  ];

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
    <div className="py-6 dark:text-gray-200">
      <h1 className="text-2xl font-bold mb-6">Управление коробками</h1>

      {/* Список коробок */}
      <div className="bg-white shadow rounded-lg p-6 mb-6 dark:bg-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Список коробок</h2>
          <div className="flex gap-2">
            <button
              onClick={toggleSelectionMode}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectionMode
                  ? "bg-gray-200 text-gray-800"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {selectionMode ? "Выйти из режима выбора" : "Выбрать коробки"}
            </button>

            {selectionMode && (
              <button
                onClick={deleteSelectedBoxes}
                disabled={selectedBoxes.length === 0}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  selectedBoxes.length === 0
                    ? "bg-red-300 cursor-not-allowed text-white"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {deletingBoxesIds.length > 0 ? (
                  <span className="flex items-center">
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
                    Удаление...
                  </span>
                ) : (
                  `Удалить (${selectedBoxes.length})`
                )}
              </button>
            )}
          </div>
        </div>

        {boxes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            Нет доступных коробок
          </p>
        ) : (
          <DataTable
            columns={columns}
            data={sortedBoxes}
            emptyMessage="Нет доступных коробок"
          />
        )}
      </div>

      {/* Форма создания коробки */}
      <div className="bg-white shadow rounded-lg p-6 dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-4">Создать коробку</h2>

        <form onSubmit={handleCreateBox} className="max-w-md">
          <div className="mb-4">
            <label
              htmlFor="boxName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Название коробки:
            </label>
            <input
              type="text"
              id="boxName"
              value={boxName}
              onChange={(e) => setBoxName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Введите название коробки"
              required
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 dark:bg-blue-500 dark:hover:bg-blue-400 dark:disabled:bg-blue-700"
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
