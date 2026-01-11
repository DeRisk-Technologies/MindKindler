import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Disable ESLint during build to prevent OOM / Hanging in resource-constrained environments
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Disable TypeScript checks during build to save memory
    typescript: {
        ignoreBuildErrors: true,
    },
    // Production optimizations
    poweredByHeader: false,
    reactStrictMode: true,
};

// PWA Logic (Wrapped to allow easier disabling if needed)
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firestore-data',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24,
        },
      },
    },
    {
      urlPattern: /^\/dashboard\/consultations\/live\/.*$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'live-cockpit-ui',
      },
    }
  ]
});

export default withPWA(nextConfig);
