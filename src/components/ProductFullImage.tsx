"use client";

import { useState, useEffect } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import {
  globalImageCache,
  preloadImage,
  normalizeImagePath,
  cacheImage,
} from "@/components/ProductImage";

interface ProductFullImageProps {
  images: string[];
  alt?: string;
}

// Функция для проверки существования изображения
async function validateImageExists(src: string): Promise<boolean> {
  if (!src) return false;

  // Используем нормализованный путь
  const normalizedSrc = normalizeImagePath(src);

  // Проверяем наличие в глобальном кеше памяти - самый быстрый способ
  if (globalImageCache.has(normalizedSrc)) {
    return true;
  }

  // Проверяем наличие в кеше браузера
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cacheName = "mila-erp-images-cache";
      const cache = await caches.open(cacheName);
      const cacheResponse = await cache.match(normalizedSrc);

      if (cacheResponse) {
        // Изображение в кеше, возвращаем true немедленно
        // Асинхронно в фоне проверим обновление
        setTimeout(() => {
          fetch(normalizedSrc, { method: "HEAD", cache: "no-cache" }).catch(
            () => {}
          );
        }, 0);

        return true;
      }
    } catch (error) {
      console.warn("Ошибка проверки кеша:", error);
    }
  }

  // Если в кеше нет, проверяем на сервере
  try {
    const response = await fetch(normalizedSrc, {
      method: "HEAD",
      cache: "no-cache",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default function ProductFullImage({
  images,
  alt,
}: ProductFullImageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false); // Изначально не показываем загрузку
  const [cachedImages, setCachedImages] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [validImages, setValidImages] = useState<string[]>([]);

  // Проверяем и фильтруем существующие изображения
  useEffect(() => {
    async function validateImages() {
      if (images && images.length > 0) {
        // Нормализуем пути и проверяем каждое изображение
        const normalizedImages = images.map((img) => normalizeImagePath(img));
        const validationPromises = normalizedImages.map((img) =>
          validateImageExists(img)
        );
        const validationResults = await Promise.all(validationPromises);

        // Фильтруем только существующие изображения
        const filtered = normalizedImages.filter(
          (_, index) => validationResults[index]
        );
        setValidImages(filtered);
      } else {
        setValidImages([]);
      }
    }

    validateImages();
  }, [images]);

  // Кешируем все изображения при загрузке компонента
  useEffect(() => {
    const cacheAllImages = async () => {
      if (
        validImages &&
        validImages.length > 0 &&
        typeof window !== "undefined"
      ) {
        try {
          // Сначала проверяем наличие изображений в глобальном кеше
          const cachedResults = validImages.map((img) =>
            globalImageCache.has(img) ? globalImageCache.get(img)! : null
          );

          // Если все изображения уже в кеше, используем их
          if (cachedResults.every((img) => img !== null)) {
            setCachedImages(cachedResults as string[]);
            setIsLoading(false); // Изображения уже в кеше, не показываем загрузку
            setIsInitialized(true);
            return;
          }

          // Предзагрузка первого изображения для быстрого отображения
          if (validImages[0]) {
            // Проверяем, есть ли первое изображение в кеше
            const isFirstInCache = globalImageCache.has(validImages[0]);
            if (!isFirstInCache) {
              // Если первого изображения нет в кеше, показываем загрузку
              setIsLoading(true);
            }
            preloadImage(validImages[0]);
          }

          // Кешируем остальные изображения параллельно
          const cachedImagesPromises = validImages.map((img) =>
            cacheImage(img)
          );
          const results = await Promise.all(cachedImagesPromises);
          const filteredResults = results.filter((url) => url); // Фильтруем пустые URL
          setCachedImages(filteredResults);
        } catch (error) {
          console.warn("Ошибка кеширования изображений:", error);
          setCachedImages(validImages);
        } finally {
          setIsInitialized(true);
          setIsLoading(false); // Всегда отключаем загрузку после завершения
        }
      } else {
        setCachedImages([]);
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    cacheAllImages();
  }, [validImages]);

  // Предварительно загружаем следующее и предыдущее изображения
  useEffect(() => {
    if (!isInitialized || cachedImages.length <= 1) return;

    const nextIndex = (currentIndex + 1) % cachedImages.length;
    const prevIndex =
      (currentIndex - 1 + cachedImages.length) % cachedImages.length;

    // Предзагружаем соседние изображения
    if (cachedImages[nextIndex]) preloadImage(cachedImages[nextIndex]);
    if (cachedImages[prevIndex]) preloadImage(cachedImages[prevIndex]);
  }, [currentIndex, cachedImages, isInitialized]);

  const nextImage = () => {
    if (cachedImages.length <= 1) return;
    // Проверяем, есть ли следующее изображение в кеше
    const nextIndex = (currentIndex + 1) % cachedImages.length;
    const nextImage = cachedImages[nextIndex];
    // Показываем загрузку только если изображения нет в кеше
    setIsLoading(!globalImageCache.has(nextImage));
    setCurrentIndex(nextIndex);
  };

  const prevImage = () => {
    if (cachedImages.length <= 1) return;
    // Проверяем, есть ли предыдущее изображение в кеше
    const prevIndex =
      (currentIndex - 1 + cachedImages.length) % cachedImages.length;
    const prevImage = cachedImages[prevIndex];
    // Показываем загрузку только если изображения нет в кеше
    setIsLoading(!globalImageCache.has(prevImage));
    setCurrentIndex(prevIndex);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  if (!cachedImages || cachedImages.length === 0) {
    return (
      <div className="w-full h-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">Нет фотографий</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Основное изображение */}
      <div
        className="relative bg-white rounded-lg overflow-hidden"
        style={{ height: "400px" }}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
            <span className="text-gray-400">Загрузка изображения...</span>
          </div>
        )}

        <img
          src={cachedImages[currentIndex]}
          alt={`${alt || "Изображение товара"} ${currentIndex + 1}`}
          className={`w-full h-full object-contain ${
            isLoading ? "opacity-0" : "opacity-100"
          } transition-opacity duration-300`}
          onLoad={handleImageLoad}
          fetchPriority={currentIndex === 0 ? "high" : "auto"}
          decoding="async"
        />

        {cachedImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-2 hover:bg-opacity-100 shadow-sm z-10"
              aria-label="Предыдущее изображение"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-2 hover:bg-opacity-100 shadow-sm z-10"
              aria-label="Следующее изображение"
            >
              <ArrowRightIcon className="h-5 w-5 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {/* Миниатюры */}
      {cachedImages.length > 1 && (
        <div className="mt-4 flex space-x-2 overflow-x-auto">
          {cachedImages.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                // Показываем загрузку только если изображения нет в кеше
                setIsLoading(!globalImageCache.has(image));
                setCurrentIndex(index);
              }}
              className={`h-16 w-16 relative flex-shrink-0 rounded-md overflow-hidden border-2 ${
                index === currentIndex
                  ? "border-blue-500"
                  : "border-transparent"
              }`}
              aria-label={`Выбрать изображение ${index + 1}`}
            >
              <img
                src={image}
                alt={`Миниатюра ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
