"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Product } from "@/types";
import { globalImageCache, preloadImage } from "@/components/ProductImage";

// Функция для загрузки и кеширования изображения через Cache API
async function cacheImage(src: string): Promise<string> {
  // Сначала проверяем глобальный кеш в памяти
  if (globalImageCache.has(src)) {
    return globalImageCache.get(src)!;
  }

  // Проверка поддержки Cache API в браузере
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cacheName = "mila-erp-images-cache";
      const cache = await caches.open(cacheName);

      // Проверяем, есть ли изображение в кеше
      const match = await cache.match(src);
      if (match) {
        // Сохраняем в глобальный кеш для быстрого доступа
        globalImageCache.set(src, src);
        return src; // Изображение уже в кеше
      }

      // Если изображения нет в кеше, загружаем и кешируем его
      try {
        const response = await fetch(src, {
          cache: "force-cache",
          credentials: "omit",
          headers: {
            "Cache-Control": "max-age=31536000, immutable",
            Pragma: "no-cache",
          },
        });

        if (response.ok) {
          await cache.put(src, response.clone());
          // Сохраняем в глобальный кеш
          globalImageCache.set(src, src);
        }
      } catch (fetchError) {
        console.warn("Ошибка загрузки изображения:", fetchError);
      }
    } catch (error) {
      console.warn("Ошибка кеширования изображения:", error);
    }
  }
  return src;
}

// Функция для нормализации путей к изображениям (копируем из ProductImage.tsx)
function normalizeImagePath(src: string): string {
  if (!src) return "";

  // Исправляем дублирование путей /uploads//app/public/uploads/
  if (src.includes("/uploads//app/public/uploads/")) {
    // Извлекаем имя файла из некорректного пути
    const parts = src.split("/");
    const filename = parts[parts.length - 1];
    // Проверяем, существует ли файл в директории uploads
    return `/uploads/${filename}`;
  }

  // Исправляем любые дубликаты /uploads/ в начале пути
  if (src.startsWith("/uploads/")) {
    const parts = src.split("/");
    const filename = parts[parts.length - 1];
    return `/uploads/${filename}`;
  }

  return src;
}

// Проверяем существование изображения перед его отображением
async function validateImageExists(src: string): Promise<boolean> {
  if (!src) return false;

  // Используем нормализованный путь
  const normalizedSrc = normalizeImagePath(src);

  try {
    // Отключаем проверку существования файла, так как она может вызвать проблемы
    // на разных окружениях. Вместо этого, отобразим изображение и обработаем ошибку,
    // если она возникнет при загрузке.
    return true;

    // Старый код проверки существования:
    // const response = await fetch(normalizedSrc, {
    //   method: "HEAD",
    //   cache: "no-cache",
    // });
    // return response.ok;
  } catch {
    return false;
  }
}

// Создаем простой компонент для карточки товара с надежным отображением изображений
export default function ProductCard({ product }: { product: Product }) {
  const [cachedImageSrc, setCachedImageSrc] = useState<string | null>(() => {
    if (product.photo_paths && product.photo_paths.length > 0) {
      const imageSrc = product.photo_paths[0];
      const normalizedSrc = normalizeImagePath(imageSrc);
      // Инициализируем из глобального кеша, если изображение уже есть там
      return globalImageCache.has(normalizedSrc)
        ? globalImageCache.get(normalizedSrc)!
        : normalizedSrc;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Валидируем изображение перед загрузкой
  useEffect(() => {
    async function checkImage() {
      if (product.photo_paths && product.photo_paths.length > 0) {
        const imageSrc = product.photo_paths[0];
        const normalizedSrc = normalizeImagePath(imageSrc);
        const exists = await validateImageExists(normalizedSrc);

        if (!exists) {
          setImageError(true);
          setCachedImageSrc(null);
          console.warn(`Изображение не существует: ${normalizedSrc}`);
        }
      }
    }

    checkImage();
  }, [product.photo_paths]);

  // Оптимизированная функция для кеширования
  const fetchAndCacheImage = useCallback(async () => {
    if (
      imageError ||
      !product.photo_paths ||
      product.photo_paths.length === 0
    ) {
      return;
    }

    const imageSrc = product.photo_paths[0];
    const normalizedSrc = normalizeImagePath(imageSrc);

    // Убираем дополнительную проверку на /uploads/, чтобы обработать все типы изображений
    try {
      // Быстрая проверка на наличие изображения в кеше памяти
      if (globalImageCache.has(normalizedSrc)) {
        setCachedImageSrc(globalImageCache.get(normalizedSrc)!);
        setIsLoading(false); // Сразу отмечаем как загруженное, если в кеше
        return;
      }

      const cachedSrc = await cacheImage(normalizedSrc);
      if (!cachedSrc) {
        setImageError(true);
        setCachedImageSrc(null);
        return;
      }
      setCachedImageSrc(cachedSrc);
    } catch (err) {
      console.warn("Не удалось кешировать изображение:", err);
      setImageError(true);
      setCachedImageSrc(null);
    }
  }, [product.photo_paths, imageError]);

  // Кешируем изображение при монтировании компонента
  useEffect(() => {
    if (imageError) {
      setIsLoading(false);
      return;
    }

    if (product.photo_paths && product.photo_paths.length > 0) {
      setIsLoading(true);
      // Предзагрузка изображения для быстрого отображения
      const imageSrc = product.photo_paths[0];
      const normalizedSrc = normalizeImagePath(imageSrc);

      if (normalizedSrc.startsWith("/uploads/")) {
        preloadImage(normalizedSrc);
      }

      fetchAndCacheImage();
    } else {
      setCachedImageSrc(null);
      setIsLoading(false);
    }
  }, [product.photo_paths, fetchAndCacheImage, imageError]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
    setCachedImageSrc(null);
  };

  return (
    <Link
      href={`/product/${product.id}`}
      className="block rounded-lg bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Контейнер для изображения с фиксированным соотношением сторон */}
      <div className="aspect-square w-full overflow-hidden bg-gray-100 relative">
        {cachedImageSrc && !imageError ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                <span className="text-gray-400 text-sm">Загрузка...</span>
              </div>
            )}
            <img
              src={cachedImageSrc}
              alt={product.name}
              className={`w-full h-full object-contain transition-opacity duration-300 ${
                isLoading ? "opacity-0" : "opacity-100"
              }`}
              style={{ maxWidth: "100%", maxHeight: "100%" }}
              loading="lazy"
              onLoad={handleImageLoad}
              onError={handleImageError}
              fetchPriority="auto"
              decoding="async"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-sm">Нет фото</span>
          </div>
        )}
      </div>

      {/* Информация о товаре */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {product.category || "Без категории"}
          </span>
          {product.price ? (
            <span className="text-sm font-semibold">{product.price} ₽</span>
          ) : (
            <span className="text-xs text-gray-500">Цена не указана</span>
          )}
        </div>
      </div>
    </Link>
  );
}
