"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { H1, Label, ErrorText, SuccessText } from "@/components/Typography";
import ProductImage from "@/components/ProductImage";
import { Product } from "@/types";

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter();

  // Используем объект деструктуризации с React.use для клиентского кода
  // В такой ситуации нам нужно использовать React.use для клиентских компонентов
  const [productId, setProductId] = useState<string>("");

  useEffect(() => {
    const getParamId = async () => {
      const unwrappedParams = await params;
      setProductId(unwrappedParams.id);
    };
    getParamId();
  }, [params]);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    description: "",
    price: "",
    category: "",
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [result, setResult] = useState<{
    message?: string;
    error?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}`);

      if (!response.ok) {
        throw new Error("Ошибка при получении данных товара");
      }

      const data = await response.json();
      setProduct(data);

      // Заполняем форму данными товара
      setFormData({
        name: data.name || "",
        quantity: data.quantity?.toString() || "",
        description: data.description || "",
        price: data.price?.toString() || "",
        category: data.category || "",
      });
    } catch (err) {
      console.error("Ошибка при загрузке товара:", err);
      setResult({ error: "Не удалось загрузить информацию о товаре" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });

      if (files) {
        Array.from(files).forEach((file) => {
          data.append("photos", file);
        });
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        body: data,
      });

      const result = await response.json();

      if (response.ok) {
        setResult({
          message: "Товар успешно обновлен",
        });

        // Обновляем данные продукта
        fetchProduct();
      } else {
        setResult({
          error: result.error || "Произошла ошибка при обновлении товара",
        });
      }
    } catch (error) {
      setResult({ error: "Произошла ошибка при отправке формы" });
      console.error("Ошибка при отправке формы:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePhoto = async (photoPath: string) => {
    try {
      setIsDeleting(photoPath);

      const response = await fetch(`/api/products/${productId}/photo`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ photoPath }),
      });

      const result = await response.json();

      if (response.ok) {
        // Обновляем данные продукта после удаления фото
        fetchProduct();
        setResult({
          message: "Фотография успешно удалена",
        });
      } else {
        setResult({
          error: result.error || "Ошибка при удалении фотографии",
        });
      }
    } catch (error) {
      console.error("Ошибка при удалении фотографии:", error);
      setResult({ error: "Произошла ошибка при удалении фотографии" });
    } finally {
      setIsDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4 mx-auto"></div>
          <div className="h-4 w-48 bg-gray-200 rounded mb-2.5 mx-auto"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/product/${productId}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Назад
        </Link>
        <H1 className="text-center flex-1">Редактирование</H1>
        <div className="w-14"></div>
      </div>

      {result && (
        <div className="mb-6">
          {result.error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <ErrorText>{result.error}</ErrorText>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <SuccessText>{result.message}</SuccessText>
            </div>
          )}
        </div>
      )}

      <div className="bg-white shadow-lg rounded-lg p-8 mb-6">
        {product && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Текущие фото:</h2>
            <div className="flex flex-wrap gap-4">
              {product.photo_paths && product.photo_paths.length > 0 ? (
                product.photo_paths.map((photo, index) => (
                  <div key={index} className="h-24 w-24 relative group">
                    <ProductImage
                      src={photo}
                      alt={`Фото ${index + 1}`}
                      fill
                      className="rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo)}
                      disabled={isDeleting === photo}
                      className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full m-1 transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Удалить фото"
                    >
                      {isDeleting === photo ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        <XMarkIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Нет фотографий</p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Название:</Label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 text-base py-2"
            />
          </div>

          <div>
            <Label htmlFor="quantity">Количество:</Label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 text-base py-2"
            />
          </div>

          <div>
            <Label htmlFor="description">Описание:</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 text-base py-2"
            />
          </div>

          <div>
            <Label htmlFor="price">Цена:</Label>
            <input
              type="number"
              step="0.01"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 text-base py-2"
            />
          </div>

          <div>
            <Label htmlFor="category">Категория:</Label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 text-base py-2"
            />
          </div>

          <div>
            <Label htmlFor="photos">Добавить новые фотографии (до 10):</Label>
            <p className="text-sm text-gray-500 mb-2">
              Новые фотографии будут добавлены к существующим
            </p>
            <input
              type="file"
              id="photos"
              name="photos"
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="mt-1 block w-full text-base text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-base file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <Link
              href={`/product/${productId}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Отмена
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:bg-blue-300"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Сохранение...
                </>
              ) : (
                "Сохранить изменения"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
