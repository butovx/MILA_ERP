"use client";

import { useState, useEffect, useRef } from "react";
import { Product } from "@/types";
import ProductImage from "@/components/ProductImage";
import Barcode from "@/components/Barcode";
import Link from "next/link";
import {
  CameraIcon,
  ArrowPathIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

declare global {
  interface Window {
    Quagga: any;
  }
}

export default function ScanPage() {
  const [barcode, setBarcode] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [box, setBox] = useState<any>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const scanLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Загружаем библиотеку Quagga динамически
    const loadQuagga = async () => {
      if (typeof window !== "undefined" && !window.Quagga) {
        const QuaggaModule = await import("quagga");
        window.Quagga = QuaggaModule.default;
      }

      initializeScanner();
    };

    loadQuagga();

    return () => {
      if (typeof window !== "undefined" && window.Quagga) {
        window.Quagga.stop();
      }
    };
  }, []);

  const initializeScanner = () => {
    if (typeof window === "undefined" || !window.Quagga) return;

    setIsScanning(true);
    setBarcode(null);
    setProduct(null);
    setError(null);

    if (window.Quagga.initialized) {
      window.Quagga.stop();
    }

    window.Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment",
          },
        },
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
        numOfWorkers: 2,
        decoder: {
          readers: ["ean_reader"],
        },
        locate: true,
      },
      (err: any) => {
        if (err) {
          console.error("Ошибка инициализации сканера:", err);
          setError(
            "Не удалось инициализировать сканер. Проверьте разрешения камеры."
          );
          setIsScanning(false);
          return;
        }

        window.Quagga.initialized = true;
        window.Quagga.start();

        window.Quagga.onDetected((result: any) => {
          const code = result.codeResult.code;
          if (code && code.length === 13) {
            // Проверяем префикс штрихкода
            const prefix = code.substring(0, 3);
            if (prefix !== "300" && prefix !== "200") {
              setError(
                `Неверный префикс штрихкода: ${prefix}. Допустимы только префиксы 300 и 200.`
              );
              setProduct(null);
              return;
            }

            // Останавливаем сканирование
            window.Quagga.stop();
            setIsScanning(false);
            setBarcode(code);

            // Добавляем в лог
            addToScanLog(code);

            // Ищем товар
            fetchProduct(code);
          }
        });
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.length === 13) {
      // Проверяем префикс штрихкода
      const prefix = manualBarcode.substring(0, 3);
      if (prefix !== "300" && prefix !== "200") {
        setError(
          `Неверный префикс штрихкода: ${prefix}. Допустимы только префиксы 300 и 200.`
        );
        setProduct(null);
        return;
      }

      setBarcode(manualBarcode);
      addToScanLog(manualBarcode);
      fetchProduct(manualBarcode);
    } else {
      setError("Неверный формат штрихкода. Должен быть EAN13 (13 цифр)");
    }
  };

  const addToScanLog = (code: string) => {
    if (!scanLogRef.current) return;

    const date = new Date();
    const time = date.toLocaleTimeString();

    const entry = document.createElement("div");
    entry.className = "mb-2 p-2 bg-gray-50 rounded";
    entry.textContent = `${time}: ${code}`;

    scanLogRef.current.prepend(entry);

    // Ограничиваем количество записей
    const entries = scanLogRef.current.querySelectorAll("div");
    if (entries.length > 10) {
      scanLogRef.current.removeChild(entries[entries.length - 1]);
    }
  };

  const fetchProduct = async (code: string) => {
    try {
      setLoading(true);
      setError(null);

      // Сначала проверяем, является ли код штрихкодом коробки
      const boxResponse = await fetch(`/api/boxes/barcode/${code}`);

      if (boxResponse.ok) {
        const boxData = await boxResponse.json();
        setBox(boxData);
        setProduct(null);
        // Останавливаем сканер
        if (window.Quagga) {
          window.Quagga.stop();
          setIsScanning(false);
        }
        return;
      }

      // Если это не коробка, проверяем товар
      const productResponse = await fetch(`/api/products/barcode/${code}`);

      if (!productResponse.ok) {
        if (productResponse.status === 404) {
          setError(`Товар со штрихкодом ${code} не найден`);
          setProduct(null);
          setBox(null);
        } else {
          throw new Error("Ошибка при получении данных");
        }
        return;
      }

      const data = await productResponse.json();
      setProduct(data);
      setBox(null);
      // Останавливаем сканер, так как товар найден
      if (window.Quagga) {
        window.Quagga.stop();
        setIsScanning(false);
      }
    } catch (err) {
      setError("Ошибка при поиске товара");
      setProduct(null);
      setBox(null);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const restartScanner = () => {
    setBarcode(null);
    setProduct(null);
    setBox(null);
    setError(null);
    setManualBarcode("");
    initializeScanner();
  };

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-6">Сканировать штрихкод</h1>

      {/* Видео для сканирования */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div
          ref={videoRef}
          className={`relative bg-black rounded-lg overflow-hidden w-full max-w-lg mx-auto h-64 ${
            isScanning ? "" : "hidden"
          }`}
        >
          <div
            id="scanner-overlay"
            className="absolute inset-0 pointer-events-none"
          >
            <div className="w-full h-full border-2 border-red-500 border-dashed absolute"></div>
          </div>
        </div>

        {/* Результат сканирования */}
        {barcode && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-green-800 font-medium">Отсканирован штрихкод:</p>
            <div className="mt-2">
              <Barcode
                value={barcode}
                height={80}
                width={1.5}
                fontSize={16}
                margin={10}
                className="max-w-full"
                textMargin={5}
                id={`barcode-${barcode}`}
              />
            </div>
          </div>
        )}

        {/* Форма для ручного ввода */}
        <form onSubmit={handleSubmit} className="mt-6 flex items-center">
          <div className="flex-grow">
            <label
              htmlFor="manualBarcode"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Или введите штрихкод вручную:
            </label>
            <input
              type="text"
              id="manualBarcode"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="Введите 13 цифр..."
              maxLength={13}
              className="w-full block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <CheckIcon className="h-5 w-5 mr-1" />
            Проверить
          </button>
        </form>

        {/* Кнопка перезапуска сканера */}
        <div className="mt-6 text-center">
          <button
            onClick={restartScanner}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <CameraIcon className="h-5 w-5 mr-1" />
            {isScanning ? "Остановить сканер" : "Запустить сканер"}
          </button>
        </div>
      </div>

      {/* Информация о товаре или коробке */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-2 text-gray-600">Поиск...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <h2 className="text-red-800 font-medium">Ошибка</h2>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {box && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Содержимое коробки: {box.name}
          </h2>

          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Штрихкод коробки:
            </h3>
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

          {box.items && box.items.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Товары в коробке:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {box.items.map((item: any) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start">
                      {item.photo_paths && item.photo_paths.length > 0 && (
                        <div className="w-20 h-20 mr-4">
                          <ProductImage
                            src={item.photo_paths[0]}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="object-contain rounded-md"
                          />
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Количество: {item.quantity}
                        </p>
                        <p className="text-sm text-gray-500">
                          Штрихкод: {item.barcode}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Коробка пуста</p>
          )}

          <div className="mt-4">
            <Link
              href={`/box-content?barcode=${box.barcode}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Управление содержимым
            </Link>
          </div>
        </div>
      )}

      {product && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Информация о товаре</h2>

          <div className="flex flex-col md:flex-row">
            {/* Изображение товара */}
            <div className="md:w-1/4 mb-4 md:mb-0 md:mr-6">
              {product.photo_paths && product.photo_paths.length > 0 ? (
                <div className="w-full h-48 relative">
                  <ProductImage
                    src={product.photo_paths[0]}
                    alt={product.name}
                    fill
                    className="object-contain rounded-md"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-md flex items-center justify-center">
                  <span className="text-gray-400">Нет фото</span>
                </div>
              )}
            </div>

            {/* Информация о товаре */}
            <div className="md:w-3/4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {product.name}
              </h3>

              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">ID:</span> {product.id}
                </p>
                <p>
                  <span className="font-medium">Штрихкод:</span>{" "}
                  {product.barcode}
                </p>
                <p>
                  <span className="font-medium">Количество:</span>{" "}
                  {product.quantity ?? "-"}
                </p>
                <p>
                  <span className="font-medium">Цена:</span>{" "}
                  {product.price ? `${product.price} ₽` : "-"}
                </p>
                <p>
                  <span className="font-medium">Категория:</span>{" "}
                  {product.category || "-"}
                </p>
                {product.description && (
                  <p>
                    <span className="font-medium">Описание:</span>{" "}
                    {product.description.length > 100
                      ? `${product.description.substring(0, 100)}...`
                      : product.description}
                  </p>
                )}
              </div>

              <div className="mt-4">
                <Link
                  href={`/product/${product.id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Полная информация
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Журнал сканирования */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Журнал сканирования</h2>
        <div
          ref={scanLogRef}
          className="max-h-64 overflow-y-auto space-y-2"
        ></div>
      </div>
    </div>
  );
}
