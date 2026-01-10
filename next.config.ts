import type { NextConfig } from "next";
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable in dev to avoid aggressive caching
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firestore-data',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 1 day
        },
      },
    },
    {
      urlPattern: /^\/dashboard\/consultations\/live\/.*$/, // Cache Live Cockpit
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'live-cockpit-ui',
      },
    }
  ]
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
