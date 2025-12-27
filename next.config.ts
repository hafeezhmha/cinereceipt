import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/ingest',
          destination: '/python-api/ingest',
        },
      ],
    };
  },
};

export default nextConfig;
