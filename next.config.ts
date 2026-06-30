import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Real product/category photos are served from loremflickr (pinned per item).
    remotePatterns: [{ protocol: "https", hostname: "loremflickr.com" }],
  },
};

export default nextConfig;
