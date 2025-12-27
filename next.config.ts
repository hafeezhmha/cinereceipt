import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/ingest',
          destination: '/api/ingest.py',
        },
      ],
    };
  },
};

export default nextConfig;
