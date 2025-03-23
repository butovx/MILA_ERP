"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Product } from "@/types";
import {
  PencilIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { H1, H2, Text, ErrorText } from "@/components/Typography";
import ProductImage from "@/components/ProductImage";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    quantity: "",
    description: "",
    price: "",
    category: "",
  });
  const [editFiles, setEditFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editResult, setEditResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(
    null
  );
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Ошибка при получении данных");
      }
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError("Не удалось загрузить список товаров");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (product: Product) => {
    setCurrentProduct(product);
    setEditFormData({
      name: product.name,
      quantity: product.quantity?.toString() || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      category: product.category || "",
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setCurrentProduct(null);
    setEditFiles(null);
    setEditResult(null);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setEditFiles(e.target.files);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    setSubmitting(true);
    setEditResult(null);

    try {
      const formData = new FormData();
      Object.entries(editFormData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (editFiles) {
        Array.from(editFiles).forEach((file) => {
          formData.append("photos", file);
        });
      }

      const response = await fetch(`/api/products/${currentProduct.id}`, {
        method: "PUT",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setEditResult({ success: true, message: "Товар успешно обновлен" });
        fetchProducts(); // Обновляем список товаров
      } else {
        setEditResult({
          success: false,
          message: result.error || "Ошибка при обновлении товара",
        });
      }
    } catch (error) {
      setEditResult({
        success: false,
        message: "Произошла ошибка при отправке формы",
      });
      console.error("Ошибка при отправке формы:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    // Находим название товара для более информативного сообщения
    const product = products.find((p) => p.id === id);

    if (
      !confirm(
        `Вы действительно хотите удалить товар "${
          product?.name || "без названия"
        }"?\nЭто действие нельзя отменить.`
      )
    )
      return;

    try {
      setDeletingProductId(id);

      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Удаляем товар из списка
        setProducts(products.filter((p) => p.id !== id));

        // Показываем уведомление об успешном удалении
        setNotification({
          type: "success",
          message: `Товар "${product?.name || "без названия"}" успешно удален`,
        });

        // Скрываем уведомление через 3 секунды
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      } else {
        const data = await response.json();
        alert(data.error || "Ошибка при удалении товара");
      }
    } catch (error) {
      console.error("Ошибка при удалении товара:", error);
      alert("Произошла ошибка при удалении товара");
    } finally {
      setDeletingProductId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4 mx-auto"></div>
          <div className="h-4 w-48 bg-gray-200 rounded mb-2.5 mx-auto"></div>
          <Text>Загрузка списка товаров...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <H2>Ошибка загрузки</H2>
        <div className="max-w-md mx-auto bg-red-50 p-4 rounded-lg mt-4">
          <ErrorText>{error}</ErrorText>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <H1>Список товаров</H1>

      {/* Уведомление */}
      {notification && (
        <div
          className={`mb-4 p-4 rounded-md ${
            notification.type === "success"
              ? "bg-green-50 text-green-900 border border-green-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider"
              >
                ID
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider"
              >
                Фото
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider"
              >
                Название
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider"
              >
                Количество
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider"
              >
                Цена
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider"
              >
                Категория
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider"
              >
                Штрихкод
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider"
              >
                Коробки
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider"
              >
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-5 text-center text-base text-gray-700"
                >
                  Нет доступных товаров
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700">
                    {product.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.photo_paths && product.photo_paths.length > 0 ? (
                      <div className="h-14 w-14 relative">
                        <ProductImage
                          src={product.photo_paths[0]}
                          alt={product.name}
                          fill
                          className="rounded-md object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-14 w-14 bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-gray-500 text-sm">Нет фото</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700">
                    {product.quantity ?? "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700">
                    {product.price ? `${product.price} ₽` : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700">
                    {product.category || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700">
                    {product.barcode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700">
                    {product.boxes && product.boxes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {product.boxes.map((box, index) => (
                          <Link
                            key={index}
                            href={`/box-content?barcode=${box.barcode}`}
                            className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                          >
                            {box.name}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700">
                    <div className="flex space-x-3">
                      <Link
                        href={`/product/${product.id}`}
                        className="text-blue-600 hover:text-blue-900 p-1.5"
                        title="Просмотреть"
                      >
                        <ArrowTopRightOnSquareIcon className="h-6 w-6" />
                      </Link>
                      <button
                        onClick={() => openEditModal(product)}
                        className="text-indigo-600 hover:text-indigo-900 p-1.5"
                        title="Редактировать"
                      >
                        <PencilIcon className="h-6 w-6" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900 p-1.5"
                        title="Удалить"
                        disabled={deletingProductId === product.id}
                      >
                        {deletingProductId === product.id ? (
                          <svg
                            className="animate-spin h-6 w-6 text-red-600"
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
                          <TrashIcon className="h-6 w-6" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Модальное окно для редактирования */}
      {editModalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 md:mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Редактировать товар</h2>
              <button
                onClick={closeEditModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="editName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Название:
                </label>
                <input
                  type="text"
                  id="editName"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="editQuantity"
                  className="block text-sm font-medium text-gray-700"
                >
                  Количество:
                </label>
                <input
                  type="number"
                  id="editQuantity"
                  name="quantity"
                  value={editFormData.quantity}
                  onChange={handleEditChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="editDescription"
                  className="block text-sm font-medium text-gray-700"
                >
                  Описание:
                </label>
                <textarea
                  id="editDescription"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="editPrice"
                  className="block text-sm font-medium text-gray-700"
                >
                  Цена:
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="editPrice"
                  name="price"
                  value={editFormData.price}
                  onChange={handleEditChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="editCategory"
                  className="block text-sm font-medium text-gray-700"
                >
                  Категория:
                </label>
                <input
                  type="text"
                  id="editCategory"
                  name="category"
                  value={editFormData.category}
                  onChange={handleEditChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Текущие фото:
                </label>
                <div className="mt-1 flex space-x-2 overflow-x-auto pb-2">
                  {currentProduct?.photo_paths &&
                  currentProduct.photo_paths.length > 0 ? (
                    currentProduct.photo_paths.map((photo, index) => (
                      <div
                        key={index}
                        className="h-16 w-16 relative flex-shrink-0"
                      >
                        <ProductImage
                          src={photo}
                          alt={`Фото ${index + 1}`}
                          fill
                          className="rounded-md object-cover"
                        />
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">
                      Нет фотографий
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="editPhotos"
                  className="block text-sm font-medium text-gray-700"
                >
                  Новые фотографии (до 10):
                </label>
                <input
                  type="file"
                  id="editPhotos"
                  name="photos"
                  onChange={handleEditFileChange}
                  multiple
                  accept="image/*"
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {submitting ? "Сохранение..." : "Сохранить"}
              </button>
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
