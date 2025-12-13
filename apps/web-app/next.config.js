/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@fayol/shared-types', '@fayol/shared-constants', '@fayol/shared-utils'],
  images: {
    domains: ['localhost'], // Para imagens locais ou avatares futuros
  },
};

module.exports = nextConfig;
