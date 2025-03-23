"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  PencilIcon,
  ArrowLeftIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import ProductImage from "@/components/ProductImage";
import { Box, Product, BoxItem } from "@/types";

// Компонент-страница, который будет отрендерен сервером
export default function BoxContentPage() {
  return (
    <Suspense fallback={<BoxContentLoading />}>
      <BoxContentClient />
    </Suspense>
  );
}

// Компонент загрузки
function BoxContentLoading() {
  return (
    <div className="py-8 px-4 flex flex-col items-center">
      <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      <p className="mt-2 text-gray-600">Загрузка содержимого коробки...</p>
    </div>
  );
}

// Основной клиентский компонент с доступом к поисковым параметрам
function BoxContentClient() {
  const searchParams = useSearchParams();
  const boxId = searchParams.get("id");
  const boxBarcode = searchParams.get("barcode");

  const [box, setBox] = useState<(Box & { items?: BoxItem[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [productBarcode, setProductBarcode] = useState("");
  const [productQuantity, setProductQuantity] = useState("1");
  const [addItemLoading, setAddItemLoading] = useState(false);
  const [addItemResult, setAddItemResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BoxItem | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editResult, setEditResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  useEffect(() => {
    if (boxId || boxBarcode) {
      fetchBoxContent();
    } else {
      setError("Необходимо указать ID или штрихкод коробки");
      setLoading(false);
    }
  }, [boxId, boxBarcode]);

  const fetchBoxContent = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (boxId) {
        response = await fetch(`/api/boxes/${boxId}`);
      } else if (boxBarcode) {
        response = await fetch(`/api/boxes/barcode/${boxBarcode}`);
      } else {
        throw new Error("Необходимо указать ID или штрихкод коробки");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка загрузки данных коробки");
      }

      const data = await response.json();
      setBox(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Ошибка при загрузке содержимого коробки:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!box || !productBarcode || !productQuantity) return;

    setAddItemLoading(true);
    setAddItemResult(null);

    try {
      const response = await fetch("/api/box-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boxId: box.id,
          productBarcode,
          quantity: parseInt(productQuantity, 10),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setAddItemResult({
          success: true,
          message: "Товар успешно добавлен в коробку",
        });
        setProductBarcode("");
        setProductQuantity("1");
        // Обновляем содержимое коробки
        fetchBoxContent();
      } else {
        setAddItemResult({
          success: false,
          message: result.error || "Ошибка при добавлении товара",
        });
      }
    } catch (error) {
      setAddItemResult({
        success: false,
        message: "Произошла ошибка при отправке запроса",
      });
      console.error("Ошибка при добавлении товара:", error);
    } finally {
      setAddItemLoading(false);
    }
  };

  const handleRemoveItem = async (boxId: number, productId: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот товар из коробки?")) {
      return;
    }

    try {
      const response = await fetch(`/api/box-items/${boxId}/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Обновляем содержимое коробки
        fetchBoxContent();
      } else {
        const result = await response.json();
        alert(result.error || "Ошибка при удалении товара");
      }
    } catch (error) {
      console.error("Ошибка при удалении товара:", error);
      alert("Произошла ошибка при отправке запроса");
    }
  };

  const openEditModal = (item: BoxItem) => {
    setEditingItem(item);
    setEditQuantity(item.quantity.toString());
    setEditModalOpen(true);
    setEditResult(null);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingItem(null);
    setEditResult(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!box || !editingItem || !editQuantity) return;

    if (!editQuantity.trim() || parseInt(editQuantity) <= 0) {
      setEditResult({
        success: false,
        message: "Количество должно быть больше 0",
      });
      return;
    }

    setEditLoading(true);
    setEditResult(null);

    try {
      const response = await fetch(
        `/api/box-items/${box.id}/${editingItem.product_id || editingItem.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity: parseInt(editQuantity),
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setEditResult({
          success: true,
          message: "Количество товара обновлено",
        });
        fetchBoxContent(); // Обновляем содержимое коробки
      } else {
        setEditResult({
          success: false,
          message: result.error || "Ошибка при обновлении количества",
        });
      }
    } catch (error) {
      setEditResult({
        success: false,
        message: "Произошла ошибка при отправке формы",
      });
      console.error("Ошибка при отправке формы:", error);
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p className="mt-2 text-gray-600">Загрузка содержимого коробки...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Ошибка: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <div className="mt-4">
          <Link
            href="/boxes"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Вернуться к списку коробок
          </Link>
        </div>
      </div>
    );
  }

  if (!box) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Внимание: </strong>
          <span className="block sm:inline">Коробка не найдена</span>
        </div>
        <div className="mt-4">
          <Link
            href="/boxes"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Вернуться к списку коробок
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Link
            href="/boxes"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Список коробок
          </Link>
          <h1 className="text-2xl font-bold mt-2">
            Коробка: {box.name}{" "}
            <span className="text-gray-500 text-sm ml-2">{box.barcode}</span>
          </h1>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Добавить товар в коробку</h2>
        <form onSubmit={handleAddItem} className="flex flex-wrap gap-4">
          <div className="w-full md:w-2/5">
            <label
              htmlFor="productBarcode"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Штрихкод товара
            </label>
            <input
              type="text"
              id="productBarcode"
              value={productBarcode}
              onChange={(e) => setProductBarcode(e.target.value)}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Введите штрихкод"
            />
          </div>
          <div className="w-full md:w-1/5">
            <label
              htmlFor="productQuantity"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Количество
            </label>
            <input
              type="number"
              id="productQuantity"
              value={productQuantity}
              onChange={(e) => setProductQuantity(e.target.value)}
              min="1"
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div className="w-full md:w-1/5 flex items-end">
            <button
              type="submit"
              disabled={addItemLoading}
              className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full"
            >
              {addItemLoading ? (
                <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
              ) : (
                <PlusIcon className="h-4 w-4 mr-1" />
              )}
              Добавить
            </button>
          </div>
        </form>

        {addItemResult && (
          <div
            className={`mt-4 p-3 rounded-md ${
              addItemResult.success
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {addItemResult.message}
          </div>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h2 className="text-xl font-semibold p-6 border-b">
          Содержимое коробки
        </h2>

        {box.items && box.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Товар
                  </th>
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
                    Количество
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {box.items.map((item) => (
                  <tr key={item.product_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative">
                          <ProductImage
                            src={
                              item.photo_paths && item.photo_paths.length > 0
                                ? item.photo_paths[0]
                                : "/placeholder.png"
                            }
                            alt={item.name}
                            fill
                            className="rounded object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                          {item.category && (
                            <div className="text-sm text-gray-500">
                              {item.category}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.barcode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <PencilIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() =>
                          handleRemoveItem(box.id, item.product_id)
                        }
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            В этой коробке пока нет товаров
          </div>
        )}
      </div>

      {/* Модальное окно редактирования количества */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Изменить количество
            </h3>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="editQuantity"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Количество
                </label>
                <input
                  type="number"
                  id="editQuantity"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  min="1"
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Сохранить
                </button>
              </div>
            </form>

            {editResult && (
              <div
                className={`mt-4 p-3 rounded-md ${
                  editResult.success
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {editResult.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
