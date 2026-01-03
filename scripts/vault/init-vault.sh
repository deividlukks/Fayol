#!/bin/bash
# ============================================
# Fayol - Inicialização do HashiCorp Vault
# ============================================

set -e

VAULT_ADDR="${VAULT_ADDR:-http://localhost:8200}"
VAULT_TOKEN="${VAULT_ROOT_TOKEN:-fayol-dev-root-token}"

echo "🔐 Inicializando Vault em $VAULT_ADDR..."

# Aguarda o Vault ficar disponível
echo "⏳ Aguardando Vault inicializar..."
for i in {1..30}; do
  if curl -s "$VAULT_ADDR/v1/sys/health" > /dev/null 2>&1; then
    echo "✅ Vault está online!"
    break
  fi
  echo "   Tentativa $i/30..."
  sleep 2
done

# Exporta token
export VAULT_TOKEN="$VAULT_TOKEN"

echo ""
echo "📝 Criando secrets engines..."

# Habilita KV secrets engine v2
vault secrets enable -version=2 -path=fayol kv 2>/dev/null || echo "   Secrets engine 'fayol' já existe"

echo ""
echo "🔑 Armazenando secrets de produção..."

# Database secrets
vault kv put fayol/database \
  host="postgres" \
  port="5432" \
  database="${POSTGRES_DB:-fayol_db}" \
  username="${POSTGRES_USER:-fayol_admin}" \
  password="${POSTGRES_PASSWORD:-fayol_secure_password_123!}" \
  url="postgresql://${POSTGRES_USER:-fayol_admin}:${POSTGRES_PASSWORD:-fayol_secure_password_123!}@postgres:5432/${POSTGRES_DB:-fayol_db}?schema=public"

# Redis secrets
vault kv put fayol/redis \
  host="redis" \
  port="6379" \
  password="${REDIS_PASSWORD:-redis_secure_pass_123!}"

# JWT secrets
vault kv put fayol/jwt \
  access_secret="${JWT_ACCESS_SECRET:-fayol_jwt_access_secret_very_secure_key_2024}" \
  refresh_secret="${JWT_REFRESH_SECRET:-fayol_jwt_refresh_secret_very_secure_key_2024}" \
  access_ttl="15m" \
  refresh_ttl="7d"

# API keys
vault kv put fayol/api-keys \
  telegram_bot_token="${TELEGRAM_BOT_TOKEN:-}" \
  openai_api_key="${OPENAI_API_KEY:-}" \
  sentry_dsn="${SENTRY_DSN:-}"

# Encryption keys
vault kv put fayol/encryption \
  app_secret="${APP_SECRET:-fayol_app_secret_key_very_secure_2024}" \
  cookie_secret="${COOKIE_SECRET:-fayol_cookie_secret_key_2024}"

echo ""
echo "✅ Secrets armazenados com sucesso!"
echo ""
echo "📋 Resumo:"
echo "   Vault UI: $VAULT_ADDR/ui"
echo "   Root Token: $VAULT_TOKEN"
echo "   Secrets Path: fayol/"
echo ""
echo "🔍 Testar acesso:"
echo "   vault kv get fayol/database"
echo "   vault kv get fayol/redis"
echo "   vault kv get fayol/jwt"
echo ""
