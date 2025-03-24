"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Product } from "@/types";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import ProductImage from "@/components/ProductImage";
import Barcode from "@/components/Barcode";

interface ProductDisplayProps {
  productId: string;
}

export default function ProductDisplay({ productId }: ProductDisplayProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

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

  const nextPhoto = () => {
    if (!product || !product.photo_paths || product.photo_paths.length <= 1)
      return;
    setCurrentPhotoIndex((currentPhotoIndex + 1) % product.photo_paths.length);
  };

  const prevPhoto = () => {
    if (!product || !product.photo_paths || product.photo_paths.length <= 1)
      return;
    setCurrentPhotoIndex(
      (currentPhotoIndex - 1 + product.photo_paths.length) %
        product.photo_paths.length
    );
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
      <div className="mb-6">
        <Link
          href="/products"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Вернуться к списку товаров
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="md:flex">
          {/* Блок с фотографиями */}
          <div className="md:w-1/2 p-6">
            <div className="relative h-80 bg-gray-100 rounded-lg overflow-hidden">
              {product.photo_paths && product.photo_paths.length > 0 ? (
                <>
                  <ProductImage
                    src={product.photo_paths[currentPhotoIndex]}
                    alt={product.name}
                    fill
                    className="object-contain"
                  />
                  {product.photo_paths.length > 1 && (
                    <>
                      <button
                        onClick={prevPhoto}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-1 hover:bg-opacity-100"
                      >
                        <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                      </button>
                      <button
                        onClick={nextPhoto}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-1 hover:bg-opacity-100"
                      >
                        <ArrowRightIcon className="h-6 w-6 text-gray-700" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-gray-400">Нет фотографий</span>
                </div>
              )}
            </div>

            {/* Миниатюры */}
            {product.photo_paths && product.photo_paths.length > 1 && (
              <div className="mt-4 flex space-x-2 overflow-x-auto">
                {product.photo_paths.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`h-16 w-16 relative flex-shrink-0 rounded-md overflow-hidden ${
                      index === currentPhotoIndex ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <ProductImage
                      src={photo}
                      alt={`Миниатюра ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
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
