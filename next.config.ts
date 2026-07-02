import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // loremflickr: seeded demo photos. res.cloudinary.com: uploaded product
    // images, store logos and avatars (direct device uploads).
    remotePatterns: [
      { protocol: "https", hostname: "loremflickr.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
