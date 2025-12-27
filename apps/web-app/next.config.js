/** @type {import('next').NextConfig} */

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
        hostname: 'api.fayol.com',
      },
      {
        protocol: 'https',
        hostname: 'fayol.com',
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
  swcMinify: true,
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
  // Webpack Optimizations
  // ==================================
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Tree shaking improvements
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }

    return config;
  },

  // ==================================
  // Experimental Features
  // ==================================
  // Note: optimizeFonts and modern are now default in Next.js 14+
  experimental: {
    // Add experimental features here if needed
  },
};

module.exports = nextConfig;