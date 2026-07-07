import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  transpilePackages: ["lucide-react"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
};

export default nextConfig;
