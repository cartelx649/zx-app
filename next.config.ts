import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    const alias = config.resolve.alias as Record<string, string | false | string[]>;
    config.resolve.alias = {
      ...alias,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };
    return config;
  },
};

export default nextConfig;
