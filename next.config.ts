import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.githubusercontent.com' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/coming-soon',
        destination: '/community',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
