import { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Проверка наличия SSL-сертификатов
const keyPath = path.resolve(__dirname, "certificates/localhost-key.pem");
const certPath = path.resolve(__dirname, "certificates/localhost.pem");
const httpsEnabled = fs.existsSync(keyPath) && fs.existsSync(certPath);

const nextConfig: NextConfig = {
  output: "standalone", // Для использования в Docker
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000, // 1 год - максимально длительное кеширование
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ["localhost"],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: true, // Отключаем оптимизацию для локальных файлов
  },
  experimental: {
    optimizeCss: true,
    serverMinification: true,
    optimisticClientCache: true,
  },
  serverExternalPackages: ["sharp"],
  webpack: (config, { dev, isServer }) => {
    // Оптимизация для сборки
    if (!dev) {
      // Настройки оптимизации для продакшн
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
