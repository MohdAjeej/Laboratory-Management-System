import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Fix WebSocket HMR connection issues in WSL2/Docker
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },

  // Ensure proper host binding
  ...(process.env.NODE_ENV === 'development' && {
    assetPrefix: process.env.NEXT_PUBLIC_BASE_URL || undefined,
  }),

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
