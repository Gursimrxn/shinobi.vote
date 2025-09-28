import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["gateway.lighthouse.storage"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "assets.aceternity.com",
      },
      {
        protocol: "https",
        hostname: "gateway.lighthouse.storage",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  // Disable static generation completely
  output: "export",
  // Disable prerendering of error pages
  generateBuildId: async () => {
    return process.env.BUILD_ID || "build-id";
  },
  // Disable static optimization for error pages
  async headers() {
    return [
      {
        source: "/500",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store",
          },
        ],
      },
      {
        source: "/404",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store",
          },
        ],
      },
      {
        source: "/_error",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store",
          },
        ],
      },
    ];
  },
  // Move this from experimental to root level
  skipTrailingSlashRedirect: true,
  // Enhance experimental options
  experimental: {
    // Disable automatic static optimization for specific pages
    optimizeCss: false,
  },
};

export default nextConfig;