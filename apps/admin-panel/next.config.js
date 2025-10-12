/** @type {import('next').NextConfig} */
const nextConfig = {
  // Adiciona a configuração de saída 'standalone'
  // Isto cria uma pasta '.next/standalone' com todas as dependências necessárias,
  // ideal para implementações em Docker.
  output: 'standalone',
};

module.exports = nextConfig;
