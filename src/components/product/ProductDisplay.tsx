"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import ProductFullImage from "@/components/ProductFullImage";
import Barcode from "@/components/Barcode";

interface ProductDisplayProps {
  productId: string;
}

export default function ProductDisplay({ productId }: ProductDisplayProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}`);

      if (!response.ok) {
        throw new Error("Ошибка при получении данных");
      }

      const data = await response.json();
      setProduct(data);
    } catch (err) {
      setError("Не удалось загрузить информацию о товаре");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadBarcode = () => {
    if (!product) return;

    const barcodeCanvas = document.getElementById(
      `barcode-${product.barcode}`
    ) as HTMLCanvasElement;
    if (barcodeCanvas) {
      const a = document.createElement("a");
      a.href = barcodeCanvas.toDataURL("image/png");
      a.download = `barcode-${product.barcode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      console.error("Штрихкод не найден на странице");
      alert("Не удалось скачать штрихкод");
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    if (
      !confirm(
        `Вы действительно хотите удалить товар "${product.name}"?\nЭто действие нельзя отменить.`
      )
    )
      return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert(`Товар "${product.name}" успешно удален`);
        router.push("/products");
      } else {
        const data = await response.json();
        alert(data.error || "Ошибка при удалении товара");
      }
    } catch (error) {
      console.error("Ошибка при удалении товара:", error);
      alert("Произошла ошибка при удалении товара");
    } finally {
      setIsDeleting(false);
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

  if (error || !product) {
    return (
      <div className="py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <h2 className="text-red-800 font-medium">Ошибка</h2>
          <p className="text-red-700 mt-1">{error || "Товар не найден"}</p>
          <Link
            href="/products"
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Вернуться к списку товаров
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/products"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Вернуться к списку товаров
        </Link>

        <div className="flex space-x-3">
          <Link
            href={`/product/${product.id}/edit`}
            className="inline-flex items-center px-2 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 min-w-[36px] sm:min-w-[auto]"
          >
            <PencilIcon className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Редактировать</span>
          </Link>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center px-2 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 min-w-[36px] sm:min-w-[auto]"
          >
            {isDeleting ? (
              <svg
                className="animate-spin h-4 w-4 sm:mr-1"
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
              <TrashIcon className="h-4 w-4 sm:mr-1" />
            )}
            <span className="hidden sm:inline">Удалить</span>
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="md:flex">
          {/* Блок с фотографиями - заменен на новый компонент */}
          <div className="md:w-1/2 p-6">
            <ProductFullImage
              images={product.photo_paths || []}
              alt={product.name}
            />
          </div>

          {/* Блок с информацией */}
          <div className="md:w-1/2 p-6 border-t md:border-t-0 md:border-l border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>

            <div className="py-4 border-t border-b border-gray-200 mb-4">
              <p className="text-gray-500 mb-2">
                Артикул: <span className="text-gray-900">{product.id}</span>
              </p>
              <p className="text-gray-500 mb-2">
                Штрихкод:{" "}
                <span className="text-gray-900">{product.barcode}</span>
              </p>
              <p className="text-gray-500 mb-2">
                Количество:{" "}
                <span className="text-gray-900">{product.quantity ?? "-"}</span>
              </p>
              <p className="text-gray-500 mb-2">
                Цена:{" "}
                <span className="text-gray-900">
                  {product.price ? `${product.price} ₽` : "-"}
                </span>
              </p>
              <p className="text-gray-500 mb-2">
                Категория:{" "}
                <span className="text-gray-900">{product.category || "-"}</span>
              </p>
            </div>

            {product.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Описание</h2>
                <p className="text-gray-700">{product.description}</p>
              </div>
            )}

            {product.boxes && product.boxes.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">
                  Находится в коробках
                </h2>
                <div className="flex flex-wrap gap-2">
                  {product.boxes.map((box, index) => (
                    <Link
                      key={index}
                      href={`/box-content?barcode=${box.barcode}`}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                    >
                      {box.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Штрихкод</h2>
              <div className="bg-white p-3 border rounded-lg">
                <Barcode
                  value={product.barcode}
                  height={80}
                  width={1.5}
                  fontSize={16}
                  margin={10}
                  className="max-w-full"
                  textMargin={5}
                  id={`barcode-${product.barcode}`}
                />
              </div>
            </div>

            <button
              onClick={downloadBarcode}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Скачать штрихкод
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
