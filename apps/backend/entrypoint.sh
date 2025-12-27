#!/bin/sh
set -e

echo "🔧 Configurando permissões..."

# Garante que o diretório home do appuser existe e tem as permissões corretas
mkdir -p /home/appuser/.cache/node/corepack
chown -R appuser:appuser /home/appuser/.cache

# Garante permissões corretas para node_modules (necessário para Prisma)
chown -R appuser:appuser /app/node_modules || true

echo "✅ Permissões configuradas!"

# Troca para o usuário appuser e executa o comando
exec gosu appuser "$@"
