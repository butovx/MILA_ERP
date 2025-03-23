import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Разрешаем локальные домены для разработки
    unoptimized: process.env.NODE_ENV === "development",
  },
  // Важно для работы локального хранилища файлов в режиме разработки
  experimental: {
    // Перемещено в соответствии с рекомендациями Next.js 15
    // serverComponentsExternalPackages: ["sharp"],
  },
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
