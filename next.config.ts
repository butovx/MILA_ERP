import { NextConfig } from "next";
import fs from "fs";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],

    unoptimized: process.env.NODE_ENV === "development",
  },
  experimental: {},
  serverExternalPackages: ["sharp"],
  webpack: (config, { dev, isServer }) => {
    if (dev && isServer) {
      const keyPath = path.resolve(__dirname, "certificates/localhost-key.pem");
      const certPath = path.resolve(__dirname, "certificates/localhost.pem");

      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        config.devServer = {
          ...config.devServer,
          server: {
            type: "https",
            options: {
              key: fs.readFileSync(keyPath),
              cert: fs.readFileSync(certPath),
            },
          },
        };
      } else {
        console.warn(
          "SSL certificates not found. HTTPS will not be enabled in development."
        );
      }
    }
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone",
};

export default nextConfig;
