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
  priority?: boolean;
  quality?: number;
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
  const [error, setError] = useState(false);

  // Проверяем локальный или удаленный URL
  const isRemoteImage = src && src.startsWith("http");

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

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        onError={() => setError(true)}
        priority={priority} // Приоритетная загрузка для важных изображений
        quality={quality} // Настраиваемое качество для сжатия
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        loading={priority ? "eager" : "lazy"}
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
      priority={priority} // Приоритетная загрузка для важных изображений
      quality={quality} // Настраиваемое качество для сжатия
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      loading={priority ? "eager" : "lazy"}
    />
  );
}
