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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

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
          toast.error({
            title: "Ошибка",
            description:
              "Не удалось инициализировать сканер. Проверьте разрешения камеры.",
          });
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
              toast.warning({
                title: "Неверный префикс",
                description: `Неверный префикс штрихкода: ${prefix}. Допустимы только префиксы 300 и 200.`,
              });
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
        toast.warning({
          title: "Неверный префикс",
          description: `Неверный префикс штрихкода: ${prefix}. Допустимы только префиксы 300 и 200.`,
        });
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
      toast.error({
        title: "Ошибка формата",
        description: "Неверный формат штрихкода. Должен быть EAN13 (13 цифр)",
      });
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
        toast.success({
          title: "Найдено",
          description: `Найдена коробка: ${boxData.name}`,
        });
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
          toast.error({
            title: "Не найдено",
            description: `Товар со штрихкодом ${code} не найден`,
          });
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
      toast.success({
        title: "Найдено",
        description: `Найден товар: ${data.name}`,
      });
      // Останавливаем сканер, так как товар найден
      if (window.Quagga) {
        window.Quagga.stop();
        setIsScanning(false);
      }
    } catch (err) {
      toast.error({
        title: "Ошибка",
        description: "Ошибка при поиске товара",
      });
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Карточка сканера */}
        <Card>
          <CardHeader>
            <CardTitle>Камера</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={videoRef}
              className={`relative bg-black rounded-lg overflow-hidden w-full h-64 ${
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
                <div className="font-semibold text-green-800 mb-2">
                  Штрихкод просканирован:
                </div>
                <div className="flex items-center space-x-2 text-gray-800">
                  <CheckIcon className="h-5 w-5 text-green-600" />
                  <span className="font-mono">{barcode}</span>
                </div>
              </div>
            )}

            <div className="flex mt-4 gap-2">
              {isScanning ? (
                <Button
                  variant="secondary"
                  onClick={() => window.Quagga.stop()}
                >
                  Приостановить
                </Button>
              ) : (
                <Button onClick={restartScanner}>
                  <CameraIcon className="h-5 w-5 mr-2" />
                  {barcode ? "Сканировать снова" : "Начать сканирование"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Карточка ручного ввода */}
        <Card>
          <CardHeader>
            <CardTitle>Ручной ввод штрихкода</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="manualBarcode"
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Штрихкод (EAN-13)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="manualBarcode"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="Введите 13-значный штрихкод"
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                    maxLength={13}
                    pattern="[0-9]{13}"
                  />
                  <Button type="submit">Поиск</Button>
                </div>
              </div>
            </form>

            {/* Лог сканирования */}
            <div className="mt-4">
              <h2 className="text-lg font-semibold mb-2">
                История сканирования
              </h2>
              <div
                ref={scanLogRef}
                className="max-h-60 overflow-y-auto space-y-1"
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Результаты сканирования */}
      <div className="mt-6">
        {error && (
          <Card className="border-danger-300 bg-danger-50 mb-4">
            <CardContent className="pt-6">
              <p className="text-danger-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card className="border-primary-300 bg-primary-50 mb-4">
            <CardContent className="pt-6 flex items-center">
              <svg
                className="animate-spin h-5 w-5 text-primary-700 mr-3"
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
              <p className="text-primary-700">Загрузка данных...</p>
            </CardContent>
          </Card>
        )}

        {/* Карточка результатов поиска */}
        {product && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Найден товар</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  {product.photo_paths && product.photo_paths.length > 0 ? (
                    <ProductImage
                      src={product.photo_paths[0]}
                      alt={product.name}
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
                      <p className="text-gray-400">Нет фото</p>
                    </div>
                  )}
                </div>
                <div className="md:w-2/3">
                  <h2 className="text-2xl font-bold mb-4">{product.name}</h2>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="font-semibold w-32">Штрихкод:</span>
                      <span className="font-mono">{product.barcode}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold w-32">Категория:</span>
                      <span>{product.category || "Не указана"}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold w-32">Количество:</span>
                      <span>{product.quantity || 0} шт.</span>
                    </div>
                    {product.description && (
                      <div className="mt-4">
                        <span className="font-semibold block mb-2">
                          Описание:
                        </span>
                        <p className="text-gray-700">{product.description}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex gap-2">
                    <Button asChild>
                      <Link href={`/product/${product.id}`}>Подробнее</Link>
                    </Button>
                    <Button variant="outline" onClick={restartScanner}>
                      Сканировать другой товар
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Результат поиска коробки */}
        {box && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Найдена коробка</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="font-semibold w-32">Название:</span>
                  <span className="text-lg font-medium">{box.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold w-32">Штрихкод:</span>
                  <span className="font-mono">{box.barcode}</span>
                </div>
                <div className="mt-4">
                  <Barcode value={box.barcode} width={2} height={60} />
                </div>

                <div className="mt-6 flex gap-2">
                  <Button asChild>
                    <Link href={`/box-content?barcode=${box.barcode}`}>
                      Перейти к содержимому
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={restartScanner}>
                    Сканировать другой товар
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
