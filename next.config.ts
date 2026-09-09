import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sertakan pg-cloudflare dalam trace output — dimuat kondisional oleh "pg"
  // saat berjalan di Cloudflare Workers, sehingga tidak terdeteksi otomatis.
  outputFileTracingIncludes: {
    "*": ["./node_modules/pg-cloudflare/**/*"],
  },
};

export default nextConfig;
