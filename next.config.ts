import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vmvsxxtaqtvaotrooafq.supabase.co",
        pathname: "/storage/v1/object/public/site-media/**",
      },
    ],
  },
};

export default nextConfig;
