"use client";

import { useState, useEffect, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  PencilIcon,
  ArrowLeftIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import ProductImage from "@/components/ProductImage";
import Barcode from "@/components/Barcode";
import { Box, Product, BoxItem } from "@/types";
import DataTable from "@/components/DataTable";
import ProductSearch from "@/components/ProductSearch";

export default function BoxContentClient() {
  const searchParams = useSearchParams();
  const boxId = searchParams.get("id");
  const boxBarcode = searchParams.get("barcode");

  const [box, setBox] = useState<(Box & { items?: BoxItem[] }) | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [productBarcode, setProductBarcode] = useState<string>("");
  const [productQuantity, setProductQuantity] = useState<string>("1");
  const [addItemLoading, setAddItemLoading] = useState<boolean>(false);
  const [addItemResult, setAddItemResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [addedProductBarcode, setAddedProductBarcode] = useState<string | null>(
    null
  );

  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<BoxItem | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>("");
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editResult, setEditResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);

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

      const data: Box & { items?: BoxItem[] } = await response.json();
      setBox(data);
    } catch (err) {
      setError("Не удалось загрузить содержимое коробки");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: FormEvent<HTMLFormElement>) => {
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
    setAddedProductBarcode(null);

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

      const result: { error?: string } = await response.json();

      if (response.ok) {
        setAddItemResult({
          success: true,
          message: "Товар добавлен в коробку",
        });
        setAddedProductBarcode(productBarcode);
        downloadBarcode(productBarcode);
        setProductBarcode("");
        setProductQuantity("1");
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
        fetchBoxContent();
      } else {
        const data: { error?: string } = await response.json();
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

  const downloadBarcode = (barcode: string) => {
    const barcodeCanvas = document.getElementById(
      `barcode-${barcode}`
    ) as HTMLCanvasElement | null;
    if (barcodeCanvas) {
      const a = document.createElement("a");
      a.href = barcodeCanvas.toDataURL("image/png");
      a.download = `barcode-${barcode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      console.error("Штрихкод не найден на странице");
      alert("Не удалось скачать штрихкод");
    }
  };

  const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
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

      const result: { error?: string } = await response.json();

      if (response.ok) {
        setEditResult({
          success: true,
          message: "Количество товара обновлено",
        });
        fetchBoxContent();
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

  const handleProductSelect = (product: Product) => {
    setProductBarcode(product.barcode);
    setProductQuantity("1");
  };

  const handleBarcodeInput = (barcode: string) => {
    setProductBarcode(barcode);
  };

  const columns = [
    {
      key: "photo",
      header: "Фото",
      render: (item: BoxItem) =>
        item.photo_paths && item.photo_paths.length > 0 ? (
          <div className="h-9 w-9 relative">
            <ProductImage
              src={item.photo_paths[0]}
              alt={item.name || "Товар"}
              fill
              className="rounded-md object-cover"
            />
          </div>
        ) : (
          <div className="h-9 w-9 bg-gray-200 rounded-md flex items-center justify-center">
            <span className="text-gray-400 text-xs">Нет</span>
          </div>
        ),
      mobilePriority: 1,
    },
    {
      key: "name",
      header: "Название",
      render: (item: BoxItem) => (
        <Link
          href={`/product/${item.product_id || item.id}`}
          className="text-blue-600 hover:text-blue-800 block max-w-[150px] truncate"
          title={item.name}
        >
          {item.name}
        </Link>
      ),
      mobilePriority: 1,
    },
    {
      key: "barcode",
      header: "Штрихкод",
      render: (item: BoxItem) => (
        <span className="font-mono text-xs">{item.barcode}</span>
      ),
      mobilePriority: 2,
    },
    {
      key: "quantity",
      header: "Количество",
      render: (item: BoxItem) => item.quantity,
      mobilePriority: 2,
    },
    {
      key: "price",
      header: "Цена",
      render: (item: BoxItem) => (item.price ? `${item.price} ₽` : "-"),
      mobilePriority: 3,
    },
    {
      key: "category",
      header: "Категория",
      render: (item: BoxItem) => item.category || "-",
      mobilePriority: 3,
    },
    {
      key: "actions",
      header: "Действия",
      render: (item: BoxItem) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openEditModal(item)}
            className="text-indigo-600 hover:text-indigo-900 p-1"
            title="Редактировать количество"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              setDeletingItemId(item.id);
              if (box) {
                handleRemoveItem(box.id, item.product_id || item.id);
              }
            }}
            className="text-red-600 hover:text-red-900 p-1"
            title="Удалить из коробки"
            disabled={deletingItemId === item.id}
          >
            {deletingItemId === item.id ? (
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
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
        <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
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
    <div className="container mx-auto px-4 py-8">
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {box.name}
            </h1>
            <p className="text-gray-600">Штрихкод: {box.barcode}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Barcode
              value={box.barcode}
              height={80}
              width={1.5}
              fontSize={16}
              margin={10}
              className="max-w-full"
              textMargin={5}
              id={`barcode-${box.barcode}`}
            />
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Добавить товар</h2>
          <form onSubmit={handleAddItem} className="space-y-4">
            <ProductSearch
              onSelect={handleProductSelect}
              onBarcodeInput={handleBarcodeInput}
            />

            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Количество
                </label>
                <input
                  type="number"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  min="1"
                />
              </div>

              <button
                type="submit"
                disabled={addItemLoading}
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {addItemLoading ? "Добавление..." : "Добавить"}
              </button>
            </div>

            {addItemResult && (
              <div
                className={`mt-2 text-sm ${
                  addItemResult.success ? "text-green-600" : "text-red-600"
                }`}
              >
                {addItemResult.message}
              </div>
            )}
          </form>
        </div>

        {!box || !box.items || box.items.length === 0 ? (
          <p className="text-gray-500">Коробка пуста</p>
        ) : (
          <DataTable
            columns={columns}
            data={box.items}
            emptyMessage="Коробка пуста"
          />
        )}
      </div>

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
