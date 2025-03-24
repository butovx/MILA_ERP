import { NextConfig } from "next";
import fs from "fs";
import path from "path";

const nextConfig: NextConfig = {
  server: {
    https: {
      key: fs.readFileSync(
        path.join(__dirname, "certificates/localhost-key.pem")
      ),
      cert: fs.readFileSync(path.join(__dirname, "certificates/localhost.pem")),
    },
  },
  // Другие настройки Next.js
  reactStrictMode: true,
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
