#!/usr/bin/env node

/**
 * Fayol - Inicialização do HashiCorp Vault
 *
 * Configura o Vault com todos os secrets necessários para o projeto:
 * - Database credentials
 * - Redis credentials
 * - JWT secrets
 * - API keys (Telegram, OpenAI, Sentry)
 * - Encryption keys
 */

const { execSync } = require('child_process');
const http = require('http');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      env: { ...process.env, ...options.env },
      ...options,
    });
  } catch (error) {
    if (!options.ignoreError) {
      throw error;
    }
    return '';
  }
}

async function waitForVault(vaultAddr, maxRetries = 30) {
  log('⏳ Aguardando Vault inicializar...', 'yellow');

  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const url = new URL('/v1/sys/health', vaultAddr);
        http
          .get(url, (res) => {
            if (res.statusCode) {
              resolve();
            } else {
              reject();
            }
          })
          .on('error', reject);
      });

      log('✅ Vault está online!', 'green');
      return true;
    } catch {
      console.log(`   Tentativa ${i + 1}/${maxRetries}...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error('Timeout aguardando Vault inicializar');
}

function putSecret(path, data) {
  const entries = Object.entries(data).map(([key, value]) => `${key}=${value}`);
  const command = `vault kv put ${path} ${entries.join(' ')}`;

  exec(command, { silent: true, ignoreError: true });
}

async function main() {
  console.log('');
  log('🔐 Fayol - Inicialização do HashiCorp Vault', 'yellow');
  console.log('================================================');
  console.log('');

  const vaultAddr = process.env.VAULT_ADDR || 'http://localhost:8200';
  const vaultToken = process.env.VAULT_ROOT_TOKEN || 'fayol-dev-root-token';

  log(`Vault Address: ${vaultAddr}`, 'cyan');
  console.log('');

  // Aguarda Vault ficar disponível
  try {
    await waitForVault(vaultAddr);
  } catch (error) {
    log('❌ Vault não ficou disponível no tempo esperado', 'red');
    console.log('   Certifique-se de que o Vault está rodando:');
    console.log('     docker-compose up -d vault');
    process.exit(1);
  }

  // Exporta variáveis de ambiente para o Vault CLI
  process.env.VAULT_ADDR = vaultAddr;
  process.env.VAULT_TOKEN = vaultToken;

  console.log('');
  log('📝 Criando secrets engines...', 'cyan');

  // Habilita KV secrets engine v2
  exec('vault secrets enable -version=2 -path=fayol kv', {
    silent: true,
    ignoreError: true,
  });
  log('   ✓ Secrets engine configurado', 'green');

  console.log('');
  log('🔑 Armazenando secrets...', 'cyan');

  // Database secrets
  const pgDb = process.env.POSTGRES_DB || 'fayol_db';
  const pgUser = process.env.POSTGRES_USER || 'fayol_admin';
  const pgPass = process.env.POSTGRES_PASSWORD || 'fayol_secure_password_123!';

  putSecret('fayol/database', {
    host: 'postgres',
    port: '5432',
    database: pgDb,
    username: pgUser,
    password: pgPass,
    url: `postgresql://${pgUser}:${pgPass}@postgres:5432/${pgDb}?schema=public`,
  });
  log('   ✓ Database secrets', 'green');

  // Redis secrets
  const redisPass = process.env.REDIS_PASSWORD || 'redis_secure_pass_123!';

  putSecret('fayol/redis', {
    host: 'redis',
    port: '6379',
    password: redisPass,
  });
  log('   ✓ Redis secrets', 'green');

  // JWT secrets
  const jwtAccessSecret =
    process.env.JWT_ACCESS_SECRET || 'fayol_jwt_access_secret_very_secure_key_2024';
  const jwtRefreshSecret =
    process.env.JWT_REFRESH_SECRET || 'fayol_jwt_refresh_secret_very_secure_key_2024';

  putSecret('fayol/jwt', {
    access_secret: jwtAccessSecret,
    refresh_secret: jwtRefreshSecret,
    access_ttl: '15m',
    refresh_ttl: '7d',
  });
  log('   ✓ JWT secrets', 'green');

  // API keys
  putSecret('fayol/api-keys', {
    telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN || '',
    openai_api_key: process.env.OPENAI_API_KEY || '',
    sentry_dsn: process.env.SENTRY_DSN || '',
  });
  log('   ✓ API keys', 'green');

  // Encryption keys
  const appSecret = process.env.APP_SECRET || 'fayol_app_secret_key_very_secure_2024';
  const cookieSecret = process.env.COOKIE_SECRET || 'fayol_cookie_secret_key_2024';

  putSecret('fayol/encryption', {
    app_secret: appSecret,
    cookie_secret: cookieSecret,
  });
  log('   ✓ Encryption keys', 'green');

  console.log('');
  log('✅ Secrets armazenados com sucesso!', 'green');
  console.log('');
  console.log('================================================');
  log('📋 Resumo:', 'cyan');
  console.log(`   Vault UI: ${vaultAddr}/ui`);
  console.log(`   Root Token: ${vaultToken}`);
  console.log(`   Secrets Path: fayol/`);
  console.log('');
  log('🔍 Testar acesso:', 'blue');
  console.log('   vault kv get fayol/database');
  console.log('   vault kv get fayol/redis');
  console.log('   vault kv get fayol/jwt');
  console.log('   vault kv get fayol/api-keys');
  console.log('   vault kv get fayol/encryption');
  console.log('');
}

main().catch((error) => {
  console.error('');
  log(`❌ Erro: ${error.message}`, 'red');
  process.exit(1);
});
