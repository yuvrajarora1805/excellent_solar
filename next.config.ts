import type { NextConfig } from "next";
import tailwindConfig from "./tailwind.config";

const nextConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  allowedDevOrigins: ['10.7.5.109', 'es.yarora.dev'],
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
};

export default nextConfig;
