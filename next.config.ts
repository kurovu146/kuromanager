import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Thư mục cha (/Users/kuro/Dev) có pnpm-lock.yaml khác → cố định root về project này.
  turbopack: { root: __dirname },
};

export default nextConfig;
