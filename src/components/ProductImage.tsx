"use client";

import Image from "next/image";
import { useState } from "react";

interface ProductImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export default function ProductImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = "",
}: ProductImageProps) {
  const [error, setError] = useState(false);

  // Проверяем локальный или удаленный URL
  const isRemoteImage = src && src.startsWith("http");

  // Если произошла ошибка загрузки, показываем плейсхолдер
  if (error) {
    return (
      <div
        className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 dark:text-gray-400 text-xs">
          Ошибка загрузки
        </span>
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        onError={() => setError(true)}
        unoptimized={!isRemoteImage} // Отключаем оптимизацию для локальных файлов
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 100}
      height={height || 100}
      className={className}
      onError={() => setError(true)}
      unoptimized={!isRemoteImage} // Отключаем оптимизацию для локальных файлов
    />
  );
}
