/** @type {import('next').NextConfig} */

// ==================================
// Bundle Analyzer
// ==================================
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
});

// ==================================
// Performance & Optimization Config
// ==================================

const nextConfig = {
  // Transpile monorepo packages
  transpilePackages: [
    '@fayol/shared-types',
    '@fayol/shared-constants',
    '@fayol/shared-utils',
    '@fayol/ui-components',
    '@fayol/web-shared',
    '@fayol/api-client',
    '@fayol/api-client-core',
  ],

  // ==================================
  // Image Optimization
  // ==================================
  images: {
    // CORREÇÃO: 'domains' foi depreciado. Usando 'remotePatterns'.
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'api.fayol.app',
      },
      {
        protocol: 'https',
        hostname: 'fayol.app',
      },
      // Adicionado preventivamente para evitar erros com avatares de Auth Social
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ==================================
  // Compiler Optimizations
  // ==================================
  // Note: removeConsole is not compatible with Turbopack
  // Use a babel plugin or manually remove console.log in production if needed

  // ==================================
  // Production Optimizations
  // ==================================
  reactStrictMode: true,
  productionBrowserSourceMaps: false,

  // ==================================
  // CDN & Caching Headers
  // ==================================
  async headers() {
    return [
      // Cache static assets (icons, images)
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache Next.js static files
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images with revalidation
      {
        source: '/:path*\\.(jpg|jpeg|png|gif|webp|avif|svg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
      // Security headers
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // ==================================
  // Turbopack Config (Next.js 16 default bundler)
  // ==================================
  // Turbopack is now the default in Next.js 16
  // No explicit configuration needed for basic usage

  // ==================================
  // Experimental Features
  // ==================================
  experimental: {
    // Turbopack is stable in Next.js 16, no longer experimental
    // Add other experimental features here if needed
  },
};

module.exports = withBundleAnalyzer(nextConfig);
