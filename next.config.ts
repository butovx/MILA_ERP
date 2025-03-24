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
};

export default nextConfig;
