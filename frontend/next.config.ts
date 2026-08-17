import type { NextConfig } from "next";
import path from "path";

const API_BACKEND =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!API_BACKEND) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${API_BACKEND.replace(/\/$/, "")}/api/:path*`,
      },
    ];
  },
  turbopack: {
    resolveAlias: {
      "@": "./src",
    },
  },
  webpack(config) {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
};

export default nextConfig;
