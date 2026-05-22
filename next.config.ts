import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Izinkan domain Supabase Storage untuk next/image
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
  },
};

export default nextConfig;
