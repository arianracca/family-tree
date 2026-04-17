// worker-loader para ELK en Web Worker
import type { NextConfig } from "next";

const nextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;

