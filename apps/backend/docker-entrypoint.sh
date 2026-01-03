#!/bin/sh
set -e

echo "🔧 Iniciando Backend do Fayol..."

# Gera o cliente do Prisma
echo "📦 Gerando Prisma Client..."
pnpm --filter @fayol/database-models run generate

# Executa as migrations
echo "🗄️  Executando migrations..."
pnpm --filter @fayol/database-models prisma migrate deploy

# Inicia o backend
echo "🚀 Iniciando servidor..."
exec pnpm --filter backend run dev
