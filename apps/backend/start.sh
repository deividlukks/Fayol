#!/bin/sh
set -e

echo "🔧 Iniciando Backend do Fayol..."

# CORREÇÃO: Regenera o Prisma Client para o ambiente Linux/Debian do container.
# Isso evita o erro "Query Engine not found" se você rodou npm install no Windows/Mac.
echo "🔄 Gerando Prisma Client..."
pnpm --filter @fayol/database-models run generate

echo "🗄️  Executando migrations..."
pnpm --filter @fayol/database-models run migrate:deploy

echo "🚀 Iniciando servidor..."
exec pnpm --filter backend run dev