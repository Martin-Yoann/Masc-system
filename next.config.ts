import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backend =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.API_BASE_URL ||
      // Keep default consistent with middleware.ts & OpenAPI server url.
      "http://43.135.134.131";

    return [
      // Proxy backend API through Next to avoid CORS issues with credentials.
      { source: "/api/:path*", destination: `${backend.replace(/\/+$/, "")}/api/:path*` },
    ];
  },
};

export default nextConfig;
