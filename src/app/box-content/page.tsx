"use client";

import { useState, useEffect } from "react";
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

export default function BoxContentPage() {
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
      setError("Не указан идентификатор или штрихкод коробки");
      setLoading(false);
    }
  }, [boxId, boxBarcode]);

  const fetchBoxContent = async () => {
    try {
      setLoading(true);

      let url = "";
      if (boxId) {
        url = `/api/boxes/${boxId}`;
      } else if (boxBarcode) {
        url = `/api/boxes/barcode/${boxBarcode}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Коробка не найдена");
        }
        throw new Error("Ошибка при получении данных");
      }

      const data = await response.json();
      setBox(data);
    } catch (err) {
      setError("Не удалось загрузить содержимое коробки");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!box) return;

    if (!productBarcode.trim()) {
      setAddItemResult({ success: false, message: "Введите штрихкод товара" });
      return;
    }

    if (!productQuantity.trim() || parseInt(productQuantity) <= 0) {
      setAddItemResult({
        success: false,
        message: "Количество должно быть больше 0",
      });
      return;
    }

    setAddItemLoading(true);
    setAddItemResult(null);

    try {
      const response = await fetch(`/api/box-items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          box_id: box.id,
          product_barcode: productBarcode,
          quantity: parseInt(productQuantity),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setAddItemResult({
          success: true,
          message: "Товар добавлен в коробку",
        });
        setProductBarcode("");
        setProductQuantity("1");
        fetchBoxContent(); // Обновляем содержимое коробки
      } else {
        setAddItemResult({
          success: false,
          message: result.error || "Ошибка при добавлении товара",
        });
      }
    } catch (error) {
      setAddItemResult({
        success: false,
        message: "Произошла ошибка при отправке формы",
      });
      console.error("Ошибка при отправке формы:", error);
    } finally {
      setAddItemLoading(false);
    }
  };

  const handleRemoveItem = async (boxId: number, productId: number) => {
    if (!confirm("Вы действительно хотите удалить этот товар из коробки?"))
      return;

    try {
      const response = await fetch(`/api/box-items/${boxId}/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Обновляем содержимое коробки
        fetchBoxContent();
      } else {
        const data = await response.json();
        alert(data.error || "Ошибка при удалении товара из коробки");
      }
    } catch (error) {
      console.error("Ошибка при удалении товара из коробки:", error);
      alert("Произошла ошибка при удалении товара из коробки");
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

    if (!editingItem || !box) return;

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
          <Link
            href="/boxes"
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
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
      <div className="py-8">
        <div className="bg-yellow-50 p-4 rounded-md">
          <h2 className="text-yellow-800 font-medium">Коробка не найдена</h2>
          <Link
            href="/boxes"
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Вернуться к списку коробок
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <Link
          href="/boxes"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Вернуться к списку коробок
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-1">Коробка: {box.name}</h1>
        <p className="text-gray-500 mb-4">
          Штрихкод: <span className="font-mono">{box.barcode}</span>
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-4">Содержимое коробки</h2>

        {!box.items || box.items.length === 0 ? (
          <p className="text-gray-500">Коробка пуста</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Фото
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
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Цена
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Категория
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
                {box.items.map((item) => (
                  <tr key={item.product_id || item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.photo_paths && item.photo_paths.length > 0 ? (
                        <div className="h-12 w-12 relative">
                          <ProductImage
                            src={item.photo_paths[0]}
                            alt={item.name || "Товар"}
                            fill
                            className="rounded-md object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center">
                          <span className="text-gray-400 text-xs">
                            Нет фото
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link
                        href={`/product/${item.product_id || item.id}`}
                        className=""
                      >
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {item.barcode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.price ? `${item.price} ₽` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Изменить количество"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() =>
                            handleRemoveItem(box.id, item.product_id || item.id)
                          }
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Удалить из коробки"
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

      {/* Форма добавления товара в коробку */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Добавить товар в коробку</h2>

        <form onSubmit={handleAddItem} className="space-y-4 max-w-md">
          <div>
            <label
              htmlFor="productBarcode"
              className="block text-sm font-medium text-gray-700"
            >
              Штрихкод товара:
            </label>
            <input
              type="text"
              id="productBarcode"
              value={productBarcode}
              onChange={(e) => setProductBarcode(e.target.value)}
              maxLength={13}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Введите штрихкод товара"
              required
            />
          </div>

          <div>
            <label
              htmlFor="productQuantity"
              className="block text-sm font-medium text-gray-700"
            >
              Количество:
            </label>
            <input
              type="number"
              id="productQuantity"
              value={productQuantity}
              onChange={(e) => setProductQuantity(e.target.value)}
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={addItemLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {addItemLoading ? (
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
                Добавление...
              </>
            ) : (
              <>
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Добавить
              </>
            )}
          </button>
        </form>

        {addItemResult && (
          <div
            className={`mt-4 p-3 rounded-md ${
              addItemResult.success
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {addItemResult.message}
          </div>
        )}
      </div>

      {/* Модальное окно для редактирования количества */}
      {editModalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 md:mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Редактировать количество
              </h2>
              <button
                onClick={closeEditModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {editingItem && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="editQuantity"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {`Товар: ${editingItem.name} (${editingItem.barcode})`}
                  </label>
                  <div className="mt-2">
                    <label
                      htmlFor="editQuantity"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Количество:
                    </label>
                    <input
                      type="number"
                      id="editQuantity"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={editLoading}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  {editLoading ? "Сохранение..." : "Сохранить"}
                </button>
              </form>
            )}

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
