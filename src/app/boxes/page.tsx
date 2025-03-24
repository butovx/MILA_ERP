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
      setDeletingBoxId(id);
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
    } finally {
      setDeletingBoxId(null);
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

  const columns = [
    {
      key: "barcode",
      header: "Штрихкод",
      sortable: true,
      render: (box: Box) => (
        <div className="flex items-center space-x-2">
          <span>{box.barcode}</span>
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
      render: (box: Box) => <div title={box.name}>{box.name}</div>,
      mobilePriority: 1,
    },
    {
      key: "actions",
      header: "Действия",
      render: (box: Box) => (
        <div className="flex space-x-2">
          <Link
            href={`/box-content?barcode=${box.barcode}`}
            className="text-blue-600 hover:text-blue-900 p-1"
            title="Просмотреть содержимое"
          >
            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
          </Link>
          <button
            onClick={() => handleDeleteBox(box.id)}
            className="text-red-600 hover:text-red-900 p-1"
            title="Удалить"
            disabled={deletingBoxId === box.id}
          >
            {deletingBoxId === box.id ? (
              <svg
                className="animate-spin h-5 w-5 text-red-600"
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
              <TrashIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      ),
      mobilePriority: 1,
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
        <h2 className="text-xl font-semibold mb-4">Список коробок</h2>

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
