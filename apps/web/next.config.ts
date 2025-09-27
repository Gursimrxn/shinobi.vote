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
    ],
  },
};

export default nextConfig;
