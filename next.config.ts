import type { NextConfig } from "next";

const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  trailingSlash: true,
  images: { unoptimized: true },
  ...(staticExport ? { output: "export" as const, distDir: "dist" } : {}),
};

export default nextConfig;
