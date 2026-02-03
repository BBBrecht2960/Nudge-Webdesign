/** @type {import('next').NextConfig} */
/* eslint-disable @typescript-eslint/no-require-imports -- next.config.js is CommonJS */
const path = require('path');

const projectRoot = path.resolve(__dirname);

const nextConfig = {
  // TypeScript: geen build failure op typefouten (clean deploy)
  typescript: { ignoreBuildErrors: true },
  // Next.js 16: Turbopack gebruikt projectmap als root (geen resolve in /Users/brecht)
  turbopack: {
    root: projectRoot,
  },
  // Webpack (fallback): idem voor production build
  webpack: (config) => {
    config.context = projectRoot;
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
    ],
    qualities: [75, 90],
  },
};

module.exports = nextConfig;
