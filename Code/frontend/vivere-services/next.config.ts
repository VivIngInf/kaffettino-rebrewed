import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    // togliere in production
    return [
      {
        source: "/api/auth/:path*", // Il browser chiama qui (localhost)
        destination: "http://213.210.20.137:6969/api/auth/:path*", // Next.js gira qui (VPS)
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
