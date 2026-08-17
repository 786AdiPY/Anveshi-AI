import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://localhost:8000/api/:path*"
            : "/api/:path*",
      },
    ];
  },
  // Vercel's hosted build has been failing to resolve the "@/*" tsconfig
  // path alias even though it's correct and builds clean everywhere else
  // this has been tested (fresh clones included). Setting the alias
  // directly in webpack sidesteps tsconfig-based resolution entirely, so
  // it can't be affected by whatever differs in that build environment.
  webpack(config) {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
};

export default nextConfig;
