"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

interface ProductImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
}

// Глобальное хранилище кешированных URL для общего доступа между компонентами
// Позволяет избежать повторного кеширования одних и тех же изображений
export const globalImageCache = new Map<string, string>();

// Функция для нормализации пути к изображению
export function normalizeImagePath(src: string): string {
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

// Функция для загрузки и кеширования изображения через Cache API
// Оптимизирована для более быстрой загрузки изображений
export async function cacheImage(src: string): Promise<string> {
  // Нормализуем путь к изображению
  const normalizedSrc = normalizeImagePath(src);

  // Проверка на null или undefined
  if (!normalizedSrc) {
    return "";
  }

  // Сначала проверяем глобальный кеш в памяти
  if (globalImageCache.has(normalizedSrc)) {
    return globalImageCache.get(normalizedSrc)!;
  }

  // Проверка поддержки Cache API в браузере
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cacheName = "mila-erp-images-cache";
      const cache = await caches.open(cacheName);

      // Проверяем, есть ли изображение в кеше браузера
      const match = await cache.match(normalizedSrc);
      if (match) {
        // Сохраняем в глобальный кеш для быстрого доступа
        globalImageCache.set(normalizedSrc, normalizedSrc);

        // Асинхронно проверяем обновление в фоне, не блокируя загрузку
        setTimeout(() => {
          fetch(normalizedSrc, { method: "HEAD", cache: "no-cache" })
            .then(async (headResponse) => {
              if (headResponse.ok) {
                fetch(normalizedSrc, { cache: "reload" })
                  .then(async (response) => {
                    if (response.ok) {
                      await cache.put(normalizedSrc, response.clone());
                    }
                  })
                  .catch(() => {});
              }
            })
            .catch(() => {});
        }, 0);

        return normalizedSrc; // Возвращаем из кеша немедленно
      }

      // Если изображения нет в кеше, проверяем существование и кешируем
      try {
        // Проверяем существование файла HEAD запросом
        const headResponse = await fetch(normalizedSrc, {
          method: "HEAD",
          cache: "no-cache",
        });

        if (!headResponse.ok) {
          return ""; // Файл не существует
        }

        // Загружаем и кешируем файл
        const response = await fetch(normalizedSrc, { cache: "reload" });

        if (response.ok) {
          await cache.put(normalizedSrc, response.clone());
          globalImageCache.set(normalizedSrc, normalizedSrc);
          return normalizedSrc;
        }

        return ""; // Проблема с загрузкой
      } catch {
        return ""; // Ошибка загрузки
      }
    } catch {
      // Возвращаем оригинальный URL при ошибке кеширования
      return normalizedSrc;
    }
  }

  // Если Cache API не поддерживается, возвращаем исходный URL
  return normalizedSrc;
}

// Предзагрузка изображений для более быстрой отрисовки
export function preloadImage(src: string): void {
  // Нормализуем путь к изображению
  const normalizedSrc = normalizeImagePath(src);

  if (typeof window !== "undefined" && normalizedSrc) {
    // Сначала проверяем, существует ли файл
    fetch(normalizedSrc, {
      method: "HEAD",
      cache: "no-cache",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    })
      .then((response) => {
        if (response.ok) {
          // Вместо создания <link rel="preload">, используем простой Image для загрузки
          // Это предотвратит появление предупреждения о неиспользуемых предзагруженных ресурсах
          const img = new window.Image();
          img.src = normalizedSrc;

          // Также начинаем кеширование в фоне
          cacheImage(normalizedSrc).catch(() => {});
        } else {
          console.warn(
            `Не удалось предзагрузить несуществующий файл: ${normalizedSrc}`
          );
        }
      })
      .catch(() => {
        console.warn(`Ошибка при проверке файла: ${normalizedSrc}`);
      });
  }
}

export default function ProductImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = "",
  priority = false,
  quality = 75,
}: ProductImageProps) {
  // Нормализуем путь к изображению
  const normalizedSrc = normalizeImagePath(src);

  const [error, setError] = useState(false);
  // Изначально считаем изображение загруженным, если оно в кеше
  const [isLoaded, setIsLoaded] = useState(globalImageCache.has(normalizedSrc));
  const [cachedSrc, setCachedSrc] = useState(() =>
    // Инициализируем из глобального кеша, если изображение уже есть там
    globalImageCache.has(normalizedSrc)
      ? globalImageCache.get(normalizedSrc)!
      : normalizedSrc
  );

  // Проверяем локальный или удаленный URL
  const isRemoteImage = normalizedSrc && normalizedSrc.startsWith("http");

  // Проверка на файл изображения из uploads
  const isUploadsImage = normalizedSrc && normalizedSrc.startsWith("/uploads/");

  // Оптимизированная функция для кеширования, использует memoization
  const fetchAndCacheImage = useCallback(async () => {
    if (!normalizedSrc) {
      setError(true);
      return;
    }

    if (isUploadsImage && !isRemoteImage && typeof window !== "undefined") {
      try {
        const cachedUrl = await cacheImage(normalizedSrc);
        if (!cachedUrl) {
          setError(true);
          return;
        }
        setCachedSrc(cachedUrl);
      } catch (err) {
        console.warn("Не удалось кешировать изображение:", err);
        setError(true);
      }
    } else {
      setCachedSrc(normalizedSrc);
    }
  }, [normalizedSrc, isUploadsImage, isRemoteImage]);

  // Кешируем изображение при монтировании компонента
  useEffect(() => {
    // Если изображение приоритетное, сразу предзагружаем его
    if (priority && normalizedSrc) {
      preloadImage(normalizedSrc);
    }

    // Проверяем, есть ли изображение уже в кеше
    if (globalImageCache.has(normalizedSrc)) {
      setCachedSrc(globalImageCache.get(normalizedSrc)!);
      setIsLoaded(true); // Отмечаем как загруженное если уже есть в кеше
      return;
    }

    // Только если изображения нет в кеше, сбрасываем состояние загрузки
    setIsLoaded(false);
    setError(false);

    fetchAndCacheImage();

    // Очистка при размонтировании компонента
    return () => {
      // Если нужно, можно добавить логику очистки ресурсов
    };
  }, [
    normalizedSrc,
    isUploadsImage,
    isRemoteImage,
    priority,
    fetchAndCacheImage,
  ]);

  // Если произошла ошибка загрузки, показываем плейсхолдер
  if (error) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-xs">Ошибка загрузки</span>
      </div>
    );
  }

  // Для изображений из uploads используем HTML img с контролем соотношения сторон
  if (isUploadsImage && !isRemoteImage) {
    if (fill) {
      return (
        <div
          className={`relative ${className}`}
          style={{ width: "100%", height: "100%" }}
        >
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
              <span className="text-gray-400 text-xs">Загрузка...</span>
            </div>
          )}
          <img
            src={cachedSrc}
            alt={alt}
            onLoad={() => {
              // Проверяем повторные вызовы события onLoad
              if (!isLoaded) {
                setIsLoaded(true);
              }
            }}
            onError={() => {
              if (!error) {
                console.warn("Ошибка загрузки изображения:", cachedSrc);
                setError(true);
              }
            }}
            loading={priority ? "eager" : "lazy"}
            className={`${
              isLoaded ? "opacity-100" : "opacity-0"
            } transition-opacity duration-300 w-full h-full ${
              className.includes("object-") ? "" : "object-contain"
            }`}
            style={{
              objectFit: className.includes("object-cover")
                ? "cover"
                : "contain",
            }}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
          />
        </div>
      );
    }

    // Для ячеек без fill создаем контейнер с контролируемым соотношением сторон
    const aspectRatio = className.includes("aspect-square")
      ? "aspect-square"
      : "aspect-auto";

    return (
      <div className={`${aspectRatio} relative ${className}`}>
        {!isLoaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
            <span className="text-gray-400 text-xs">Загрузка...</span>
          </div>
        )}
        <img
          src={cachedSrc}
          alt={alt}
          onLoad={() => {
            if (!isLoaded) {
              setIsLoaded(true);
            }
          }}
          onError={() => {
            if (!error) {
              console.warn("Ошибка загрузки изображения:", cachedSrc);
              setError(true);
            }
          }}
          loading={priority ? "eager" : "lazy"}
          className={`${
            isLoaded ? "opacity-100" : "opacity-0"
          } transition-opacity duration-300 w-full h-full object-contain`}
          width={width}
          height={height}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
        />
      </div>
    );
  }

  // Для остальных изображений используем Next.js Image
  if (fill) {
    return (
      <div className={`relative ${className}`}>
        {!isLoaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
            <span className="text-gray-400 text-xs">Загрузка...</span>
          </div>
        )}
        <Image
          src={cachedSrc}
          alt={alt}
          fill
          className={`${
            isLoaded ? "opacity-100" : "opacity-0"
          } transition-opacity duration-300 ${className}`}
          onLoadingComplete={() => setIsLoaded(true)}
          onError={() => setError(true)}
          priority={priority}
          quality={quality}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          loading={priority ? "eager" : "lazy"}
          unoptimized={isUploadsImage ? true : undefined} // Отключаем оптимизацию для локальных изображений
        />
      </div>
    );
  }

  return (
    <div className="relative">
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center"
          style={{ width: width || 100, height: height || 100 }}
        >
          <span className="text-gray-400 text-xs">Загрузка...</span>
        </div>
      )}
      <Image
        src={cachedSrc}
        alt={alt}
        width={width || 100}
        height={height || 100}
        className={`${
          isLoaded ? "opacity-100" : "opacity-0"
        } transition-opacity duration-300 ${className}`}
        onLoadingComplete={() => setIsLoaded(true)}
        onError={() => setError(true)}
        priority={priority}
        quality={quality}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        loading={priority ? "eager" : "lazy"}
        unoptimized={isUploadsImage ? true : undefined} // Отключаем оптимизацию для локальных изображений
      />
    </div>
  );
}
