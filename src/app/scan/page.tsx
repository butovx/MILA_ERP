"use client";

import { useState, useEffect, useRef } from "react";
import { Product, Box, BoxItem } from "@/types";
import ProductImage from "@/components/ProductImage";
import Barcode from "@/components/Barcode";
import Link from "next/link";
import {
  CameraIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/utils/cn";
import { buttonVariants } from "@/components/ui/button";
import DataTable from "@/components/DataTable";
import JsBarcode from "jsbarcode";

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
  const [box, setBox] = useState<Box | null>(null);
  const [boxItems, setBoxItems] = useState<BoxItem[]>([]);
  const [loadingBoxItems, setLoadingBoxItems] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanLogRef = useRef<HTMLDivElement>(null);
  const [cameraZoom, setCameraZoom] = useState(1.0);
  const [detectingCode, setDetectingCode] = useState<boolean>(false);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [notificationLocked, setNotificationLocked] = useState<boolean>(false);
  const processingRef = useRef<boolean>(false);

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

  // Обработчик для жестов касания (для увеличения/уменьшения камеры)
  useEffect(() => {
    const handleTouch = (e: TouchEvent) => {
      if (!videoRef.current || !isScanning || e.touches.length !== 2) return;

      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      // Расчет расстояния между точками касания
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      // Сохраняем начальное расстояние
      const touchStartHandler = () => {
        const initialDist = dist;

        const touchMoveHandler = (e: TouchEvent) => {
          if (e.touches.length !== 2) return;

          const touch1 = e.touches[0];
          const touch2 = e.touches[1];

          const newDist = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
          );

          // Изменение масштаба
          const newZoom = cameraZoom * (newDist / initialDist);
          setCameraZoom(Math.max(1.0, Math.min(2.0, newZoom)));
        };

        document.addEventListener("touchmove", touchMoveHandler);
        document.addEventListener(
          "touchend",
          () => {
            document.removeEventListener("touchmove", touchMoveHandler);
          },
          { once: true }
        );
      };

      touchStartHandler();
    };

    if (videoRef.current && isScanning) {
      videoRef.current.addEventListener("touchstart", handleTouch);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener("touchstart", handleTouch);
      }
    };
  }, [isScanning, cameraZoom]);

  // Функция для ручной фокусировки камеры
  const handleManualFocus = async () => {
    try {
      if (!videoRef.current) return;

      const videoTrack =
        videoRef.current.srcObject instanceof MediaStream
          ? videoRef.current.srcObject.getVideoTracks()[0]
          : null;

      if (videoTrack) {
        try {
          // Используем более общий подход с any для обхода ограничений типов
          const capabilities = videoTrack.getCapabilities() as any;

          if (capabilities && capabilities.focusMode) {
            await (videoTrack as any).applyConstraints({
              advanced: [{ focusMode: "manual" }],
            });

            // После ручной фокусировки вернуть continuous режим через секунду
            setTimeout(async () => {
              await (videoTrack as any).applyConstraints({
                advanced: [{ focusMode: "continuous" }],
              });
            }, 1000);
          }
        } catch (e) {
          console.error("Ошибка при работе с фокусировкой:", e);
        }
      }
    } catch (error) {
      console.error("Ошибка при попытке фокусировки камеры:", error);
    }
  };

  const initializeScanner = () => {
    if (typeof window === "undefined" || !window.Quagga) return;

    // Останавливаем предыдущую сессию сканирования, если она активна
    if (window.Quagga.initialized) {
      window.Quagga.stop();
    }

    // Сбрасываем состояние
    setIsScanning(true);
    setBarcode(null);
    setProduct(null);
    setBox(null);
    setBoxItems([]);
    setError(null);

    // Инициализируем сканер с таймаутом
    setTimeout(() => {
      window.Quagga.init(
        {
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector("#scanner-container"),
            constraints: {
              facingMode: "environment",
              width: { min: 450 },
              height: { min: 300 },
              aspectRatio: { min: 1, max: 2 },
              advanced: [
                {
                  focusMode: "continuous",
                  exposureMode: "continuous",
                  whiteBalanceMode: "continuous",
                } as any,
              ],
            },
            area: {
              top: "20%",
              right: "20%",
              left: "20%",
              bottom: "20%",
            },
          },
          locator: {
            patchSize: "large",
            halfSample: true,
          },
          numOfWorkers: 2,
          decoder: {
            readers: [
              {
                format: "ean_reader",
                config: {
                  // Специальные настройки для EAN-13
                  normalizeBarSpaceWidth: true, // Нормализация ширины полос
                  supplements: false, // Выключаем дополнения для увеличения скорости
                  enableEAN2: false,
                  enableEAN5: false,
                  convertEAN2toEAN13: false,
                },
              },
            ],
            multiple: false,
            debug: false,
          },
          locate: true,
          frequency: 2, // Уменьшаем частоту сканирования с 5 до 2 для снижения нагрузки
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

          // Добавляем обработчик процесса распознавания для подсветки рамки
          window.Quagga.onProcessed((result: any) => {
            // Предотвращаем слишком частые обновления состояния
            if (processingRef.current) return;

            processingRef.current = true;

            if (result && result.codeResult && result.codeResult.code) {
              const code = result.codeResult.code;

              // Проверяем, что код имеет правильную длину и валидную контрольную сумму
              if (code.length === 13 && validateEAN13(code)) {
                // Валидный штрихкод найден - включаем зеленую подсветку
                setDetectingCode(true);
                setDetectedCode(code);

                // Сбрасываем обнаружение через 500 мс
                setTimeout(() => {
                  setDetectingCode(false);
                  setDetectedCode(null);
                  processingRef.current = false;
                }, 500);
              } else {
                // Невалидный штрихкод - отключаем зеленую подсветку
                setDetectingCode(false);
                setDetectedCode(null);
                processingRef.current = false;
              }
            } else {
              // Штрихкод не обнаружен - отключаем зеленую подсветку
              setDetectingCode(false);
              setDetectedCode(null);

              // Снимаем блокировку обработки после небольшой задержки
              setTimeout(() => {
                processingRef.current = false;
              }, 100); // Добавляем небольшую задержку для предотвращения слишком частых обновлений
            }
          });

          // Упрощаем обработчик для более надежной работы
          window.Quagga.onDetected((result: any) => {
            const code = result.codeResult.code;
            if (!code || code.length !== 13) return;

            console.log(`Обнаружен код: ${code}`);

            // Дополнительная проверка для повышения точности
            // Проверяем, что контрольная сумма штрих-кода верна
            if (!validateEAN13(code)) {
              console.log(`Неверная контрольная сумма для кода: ${code}`);
              return;
            }

            // Если этот код уже был просканирован, игнорируем повторное сканирование
            if (lastScannedCode === code) {
              console.log(`Код ${code} уже был обработан`);
              return;
            }

            // Если уведомления заблокированы, просто выходим
            if (notificationLocked) {
              console.log(
                `Уведомления заблокированы. Пропускаем обработку кода ${code}`
              );
              return;
            }

            // Сохраняем текущий код как последний просканированный
            setLastScannedCode(code);

            // Блокируем уведомления на некоторое время
            setNotificationLocked(true);
            setTimeout(() => {
              setNotificationLocked(false);
            }, 3000); // Блокировка на 3 секунды

            // Проверяем префикс
            let prefix = code.substring(0, 3);

            // Добавляем в лог сканирования
            addToScanLog(code);

            // Обрабатываем код в зависимости от префикса
            if (prefix === "200") {
              // Для префикса 200 проверяем товары
              fetchProductOnly(code);
            } else if (prefix === "300") {
              // Для префикса 300 проверяем коробки
              fetchBoxOnly(code);
            } else {
              // Для других префиксов показываем ошибку
              setError(
                `Неподдерживаемый префикс штрих-кода: ${prefix}. Поддерживаются только 200 и 300.`
              );
            }
          });
        }
      );
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.length === 13) {
      // Проверяем префикс штрихкода
      const prefix = manualBarcode.substring(0, 3);
      if (prefix !== "200" && prefix !== "300") {
        setError(
          `Неподдерживаемый префикс штрих-кода: ${prefix}. Поддерживаются только 200 и 300.`
        );
        return;
      }

      // Добавляем в историю сканирования
      addToScanLog(manualBarcode);

      // Обрабатываем согласно префиксу
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

    // Уменьшаем количество записей до 5
    const entries = scanLogRef.current.querySelectorAll("div");
    if (entries.length > 5) {
      scanLogRef.current.removeChild(entries[entries.length - 1]);
    }
  };

  // Основная функция fetchProduct для маршрутизации запросов
  const fetchProduct = async (code: string) => {
    const prefix = code.substring(0, 3);

    if (prefix === "200") {
      return fetchProductOnly(code);
    } else if (prefix === "300") {
      return fetchBoxOnly(code);
    } else {
      // Для других префиксов показываем ошибку
      setError(
        `Неподдерживаемый префикс штрих-кода: ${prefix}. Поддерживаются только 200 и 300.`
      );
      return false;
    }
  };

  // Функция для проверки только товаров (для префикса 200)
  const fetchProductOnly = async (code: string) => {
    try {
      setLoading(true);
      setError(null);

      // Проверяем товар
      const productResponse = await fetch(`/api/products/barcode/${code}`);

      if (productResponse.ok) {
        const data = await productResponse.json();
        console.log("Найден товар:", data);
        setProduct(data);
        setBox(null);
        setBarcode(code);

        // Показываем уведомление при успешном нахождении товара только если уведомления не заблокированы
        if (!notificationLocked) {
          toast({
            title: "Найдено",
            description: `Найден товар: ${data.name}`,
            variant: "success",
          });
        }

        // Останавливаем сканер при успешном результате
        if (window.Quagga) {
          window.Quagga.stop();
          setIsScanning(false);
        }
        return true;
      } else if (productResponse.status === 404) {
        console.log(`Товар не найден для кода: ${code}`);
        setError(`Товар со штрихкодом ${code} не найден`);
        setProduct(null);
        setBox(null);
      } else {
        throw new Error("Ошибка при получении данных");
      }

      return false;
    } catch (err) {
      console.error("Ошибка при поиске товара:", err);
      setError("Ошибка при поиске товара");
      setProduct(null);
      setBox(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Функция для проверки только коробок (для префикса 300)
  const fetchBoxOnly = async (code: string) => {
    try {
      setLoading(true);
      setError(null);

      // Проверяем коробку
      const boxResponse = await fetch(`/api/boxes/barcode/${code}`);

      if (boxResponse.ok) {
        const boxData = await boxResponse.json();
        console.log("Найдена коробка:", boxData);
        setBox(boxData);
        setProduct(null);
        setBarcode(code);

        // Показываем уведомление при успешном нахождении коробки только если уведомления не заблокированы
        if (!notificationLocked) {
          toast({
            title: "Найдено",
            description: `Найдена коробка: ${boxData.name}`,
            variant: "success",
          });
        }

        // Загружаем содержимое коробки
        await fetchBoxContent(boxData.id);

        // Останавливаем сканер при успешном результате
        if (window.Quagga) {
          window.Quagga.stop();
          setIsScanning(false);
        }
        return true;
      } else if (boxResponse.status === 404) {
        console.log(`Коробка не найдена для кода: ${code}`);
        setError(`Коробка со штрихкодом ${code} не найдена`);
        setProduct(null);
        setBox(null);
        setBoxItems([]);
      } else {
        throw new Error("Ошибка при получении данных");
      }

      return false;
    } catch (err) {
      console.error("Ошибка при поиске коробки:", err);
      setError("Ошибка при поиске коробки");
      setProduct(null);
      setBox(null);
      setBoxItems([]);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Функция для загрузки содержимого коробки
  const fetchBoxContent = async (boxId: number) => {
    try {
      setLoadingBoxItems(true);

      const response = await fetch(`/api/boxes/${boxId}`);

      if (response.ok) {
        const data = await response.json();
        if (data.items) {
          setBoxItems(data.items);
        } else {
          setBoxItems([]);
        }
      } else {
        console.error("Ошибка при загрузке содержимого коробки");
        setBoxItems([]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке содержимого коробки:", error);
      setBoxItems([]);
    } finally {
      setLoadingBoxItems(false);
    }
  };

  const restartScanner = () => {
    setBarcode(null);
    setProduct(null);
    setBox(null);
    setBoxItems([]);
    setError(null);
    setManualBarcode("");
    setLastScannedCode(null); // Сбрасываем последний сканированный код при перезапуске сканера
    initializeScanner();
  };

  // Функция для проверки контрольной суммы EAN-13
  const validateEAN13 = (code: string): boolean => {
    // Проверка длины
    if (code.length !== 13) return false;

    // Проверка, что все символы - цифры
    if (!/^\d+$/.test(code)) return false;

    // Расчет контрольной суммы
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i], 10) * (i % 2 === 0 ? 1 : 3);
    }

    const checksum = (10 - (sum % 10)) % 10;
    const providedChecksum = parseInt(code[12], 10);

    return checksum === providedChecksum;
  };

  // Функция для скачивания штрихкода
  const downloadBarcode = (barcode: string) => {
    // Создаем временный элемент canvas с компонентом Barcode
    const tempCanvas = document.createElement("canvas");
    tempCanvas.id = `temp-barcode-${barcode}`;
    document.body.appendChild(tempCanvas);

    try {
      JsBarcode(tempCanvas, barcode, {
        format: "EAN13",
        width: 1.5,
        height: 80,
        displayValue: true,
        fontSize: 16,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000",
      });

      // Скачивание штрихкода
      const link = document.createElement("a");
      link.download = `barcode-${barcode}.png`;
      link.href = tempCanvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();

      // Удаляем временные элементы
      document.body.removeChild(link);
      document.body.removeChild(tempCanvas);

      if (!notificationLocked) {
        toast({
          title: "Успешно",
          description: `Штрихкод ${barcode} скачан`,
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Ошибка при создании штрих-кода:", error);
      if (!notificationLocked) {
        toast({
          title: "Ошибка",
          description: "Не удалось скачать штрихкод",
          variant: "destructive",
        });
      }
    }
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
              id="scanner-container"
              className={`relative mt-4 mx-auto w-full max-w-md h-[300px] md:h-[400px] rounded-lg overflow-hidden 
              ${
                detectingCode
                  ? "border-4 border-green-500"
                  : "border border-gray-300"
              }`}
              onClick={handleManualFocus}
            >
              <video ref={videoRef} className="w-full h-full object-cover" />
              <div
                id="scanner-overlay"
                className="absolute inset-0 pointer-events-none z-10"
              >
                {/* Улучшенный визуальный указатель для сканирования */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={`w-3/4 h-1/2 border-2 border-dashed rounded-lg flex flex-col items-center justify-center
                      ${
                        detectingCode
                          ? "border-green-500 bg-green-500/10"
                          : "border-primary-500"
                      }`}
                  >
                    <div className="w-full absolute top-0 left-0 h-0.5 bg-primary-500 animate-[scanline_2s_ease-in-out_infinite]"></div>

                    {detectingCode && detectedCode && (
                      <div className="bg-green-500/20 px-3 py-1 rounded-full text-sm text-green-800 font-semibold">
                        Штрихкод обнаружен
                      </div>
                    )}
                  </div>
                </div>

                {/* Индикатор активного сканирования */}
                <div className="absolute top-2 right-2 flex items-center bg-black/50 text-white px-2 py-1 rounded">
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      detectingCode ? "bg-green-500" : "bg-blue-500"
                    } animate-pulse`}
                  ></span>
                  <span className="text-xs">
                    {detectingCode
                      ? "Штрихкод обнаружен"
                      : "Сканирование активно"}
                  </span>
                </div>
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
                  <span className="font-mono">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        downloadBarcode(barcode);
                      }}
                      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      title="Нажмите для скачивания штрихкода"
                    >
                      {barcode}
                    </a>
                  </span>
                </div>
              </div>
            )}

            <div className="flex mt-4 gap-2">
              {isScanning ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (window.Quagga) {
                        window.Quagga.stop();
                      }
                      setIsScanning(false);
                      // Сбрасываем состояние ошибки при остановке сканера
                      setError(null);
                    }}
                  >
                    <XMarkIcon className="h-5 w-5 mr-2" />
                    Приостановить
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      // Сбросить зум и перезапустить сканер
                      setCameraZoom(1.0);
                      if (window.Quagga.initialized) {
                        window.Quagga.stop();
                      }
                      initializeScanner();
                    }}
                  >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Сбросить
                  </Button>
                </>
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

            <div className="mt-6 px-4 py-3 bg-primary-50 rounded-lg border border-primary-200">
              <h3 className="font-semibold text-primary-800 mb-2">
                Рекомендации для сканирования:
              </h3>
              <ul className="text-sm text-primary-700 space-y-1 list-disc list-inside">
                <li>Убедитесь, что штрих-код находится в центре рамки</li>
                <li>Держите камеру на расстоянии 15-20 см от штрих-кода</li>
                <li>
                  При проблемах с фокусом коснитесь экрана в месте штрих-кода
                </li>
                <li>Убедитесь, что штрих-код хорошо освещен и без бликов</li>
                <li>Поддерживаются только штрих-коды с префиксами 200 и 300</li>
                <li>
                  Штрих-коды с префиксом 200 проверяются только среди товаров
                </li>
                <li>
                  Штрих-коды с префиксом 300 проверяются только среди коробок
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Результаты сканирования */}
      <div className="mt-6">
        {error && (
          <Card className="border-warning-300 bg-warning-50 mb-4">
            <CardContent className="pt-6 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-6 w-6 text-warning-500 mr-3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-warning-800">{error}</p>
                <p className="text-warning-600 text-sm mt-1">
                  Продолжайте сканирование для поиска другого товара или
                  коробки.
                </p>
              </div>
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
                      <span className="font-mono">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            downloadBarcode(product.barcode);
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          title="Нажмите для скачивания штрихкода"
                        >
                          {product.barcode}
                        </a>
                      </span>
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
                    <Link
                      href={`/product/${product.id}`}
                      className={cn(
                        buttonVariants({ variant: "default" }),
                        "no-underline"
                      )}
                    >
                      Подробнее
                    </Link>
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
                  <span
                    className="font-mono cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                    onClick={() => downloadBarcode(box.barcode)}
                    title="Нажмите для скачивания штрихкода"
                  >
                    {box.barcode}
                  </span>
                </div>
                <div className="mt-4">
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

                <div className="mt-6 flex gap-2">
                  <Link
                    href={`/box-content?barcode=${box.barcode}`}
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "no-underline"
                    )}
                  >
                    Перейти к содержимому
                  </Link>
                  <Button variant="outline" onClick={restartScanner}>
                    Сканировать другой товар
                  </Button>
                </div>

                {/* Отображение содержимого коробки */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">
                    Содержимое коробки
                  </h3>

                  {loadingBoxItems ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin h-5 w-5 text-primary-600 mr-3">
                        <svg
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
                      </div>
                      <span className="text-primary-600">
                        Загрузка содержимого...
                      </span>
                    </div>
                  ) : (
                    <DataTable
                      columns={[
                        {
                          key: "photo",
                          header: "",
                          render: (item: BoxItem) => (
                            <div className="w-10 h-10 rounded overflow-hidden">
                              {item.photo_paths &&
                              item.photo_paths.length > 0 ? (
                                <ProductImage
                                  src={item.photo_paths[0]}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">
                                    Нет фото
                                  </span>
                                </div>
                              )}
                            </div>
                          ),
                          mobilePriority: 1,
                        },
                        {
                          key: "name",
                          header: "Название",
                          render: (item: BoxItem) => (
                            <div className="font-medium text-gray-900">
                              {item.name}
                            </div>
                          ),
                          mobilePriority: 1,
                        },
                        {
                          key: "barcode",
                          header: "Штрихкод",
                          render: (item: BoxItem) => (
                            <div className="font-mono">
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  downloadBarcode(item.barcode);
                                }}
                                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-xs"
                                title="Нажмите для скачивания штрихкода"
                              >
                                {item.barcode}
                              </a>
                            </div>
                          ),
                          mobilePriority: 2,
                        },
                        {
                          key: "quantity",
                          header: "Количество",
                          render: (item: BoxItem) => (
                            <span className="text-sm font-medium">
                              {item.quantity} шт.
                            </span>
                          ),
                          mobilePriority: 2,
                        },
                        {
                          key: "price",
                          header: "Цена",
                          render: (item: BoxItem) => (
                            <span className="text-sm">
                              {item.price ? `${item.price} ₽` : "-"}
                            </span>
                          ),
                        },
                        {
                          key: "actions",
                          header: "",
                          render: (item: BoxItem) => (
                            <Link
                              href={`/product/${item.id}`}
                              className="text-xs text-primary-600 hover:text-primary-800"
                            >
                              Подробнее
                            </Link>
                          ),
                          mobilePriority: 3,
                        },
                      ]}
                      data={boxItems}
                      emptyMessage="Коробка пуста"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
