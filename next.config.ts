import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vmvsxxtaqtvaotrooafq.supabase.co",
        pathname: "/storage/v1/object/public/site-media/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/privacy.html", destination: "/privacy", permanent: true },
      { source: "/terms.html", destination: "/terms", permanent: true },
      { source: "/cookies.html", destination: "/cookies", permanent: true },
    ];
  },
};

export default nextConfig;
