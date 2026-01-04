#!/usr/bin/env node

/**
 * Fayol - Setup Completo: Vault + Backup
 *
 * Configuração automática de:
 * - HashiCorp Vault (Secrets Management)
 * - Backup Automático PostgreSQL
 *
 * Este script:
 * 1. Verifica dependências (Docker, Docker Compose)
 * 2. Sobe infraestrutura (Postgres, Redis, Vault, Backup)
 * 3. Aguarda serviços ficarem saudáveis
 * 4. Inicializa Vault com secrets
 * 5. Cria backup inicial do banco de dados
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function exec(command, opts = {}) {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: opts.silent ? 'pipe' : 'inherit',
      ...opts,
    });
  } catch (error) {
    if (!opts.ignoreError) throw error;
    return '';
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkCommand(name) {
  try {
    exec(`${name} --version`, { silent: true });
    return true;
  } catch {
    return false;
  }
}

async function waitForService(name, checkFn, maxAttempts = 30, interval = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    if (checkFn()) {
      log(`✅ ${name} pronto!`, 'green');
      return true;
    }
    console.log(`   Aguardando ${name}... (${i + 1}/${maxAttempts})`);
    await sleep(interval);
  }
  return false;
}

async function main() {
  const projectRoot = path.join(__dirname, '..', '..');
  process.chdir(projectRoot);

  // Banner
  console.log('');
  log('╔══════════════════════════════════════════════════════════╗', 'yellow');
  log('║                                                          ║', 'yellow');
  log('║          🚀 FAYOL - SETUP VAULT & BACKUP 🚀              ║', 'yellow');
  log('║                                                          ║', 'yellow');
  log('║  Configuração automática de:                             ║', 'yellow');
  log('║  • HashiCorp Vault (Secrets Management)                  ║', 'yellow');
  log('║  • Backup Automático PostgreSQL                          ║', 'yellow');
  log('║                                                          ║', 'yellow');
  log('╚══════════════════════════════════════════════════════════╝', 'yellow');
  console.log('');

  // === Verificar Dependências ===
  log('🔍 Verificando dependências...', 'blue');

  if (!checkCommand('docker')) {
    log('❌ Docker não encontrado!', 'red');
    console.log('   Instale: https://docs.docker.com/get-docker/');
    process.exit(1);
  }

  if (!checkCommand('docker-compose')) {
    log('❌ Docker Compose não encontrado!', 'red');
    console.log('   Instale: https://docs.docker.com/compose/install/');
    process.exit(1);
  }

  log('✅ Todas as dependências instaladas', 'green');
  console.log('');

  // === Verificar .env ===
  if (!fs.existsSync('.env')) {
    log('⚠️  Arquivo .env não encontrado', 'yellow');

    if (fs.existsSync('.env.example')) {
      log('📝 Copiando .env.example para .env...', 'blue');
      fs.copyFileSync('.env.example', '.env');
      log('✅ Arquivo .env criado', 'green');
    } else {
      log('❌ Nem .env nem .env.example encontrados!', 'red');
      process.exit(1);
    }
  }

  console.log('');

  // === ETAPA 1: Subir Infraestrutura ===
  log('═══════════════════════════════════════════════════', 'yellow');
  log('ETAPA 1: Subir Infraestrutura', 'yellow');
  log('═══════════════════════════════════════════════════', 'yellow');
  console.log('');

  log('🐳 Iniciando containers...', 'blue');
  exec('docker-compose up -d postgres redis vault postgres-backup', { ignoreError: true });

  console.log('');
  log('⏳ Aguardando serviços ficarem saudáveis...', 'blue');
  console.log('');

  // Aguardar PostgreSQL
  await waitForService(
    'PostgreSQL',
    () => {
      const result = exec('docker exec fayol_postgres pg_isready -U fayol_admin', {
        silent: true,
        ignoreError: true,
      });
      return result.includes('accepting connections');
    },
    30,
    2000
  );

  // Aguardar Redis
  await waitForService(
    'Redis',
    () => {
      const result = exec('docker exec fayol_redis redis-cli ping', {
        silent: true,
        ignoreError: true,
      });
      return result.includes('PONG');
    },
    20,
    1000
  );

  // Aguardar Vault
  await waitForService(
    'Vault',
    () => {
      const result = exec('curl -s http://localhost:8200/v1/sys/health', {
        silent: true,
        ignoreError: true,
      });
      return result.length > 0;
    },
    20,
    2000
  );

  console.log('');

  // === ETAPA 2: Inicializar Vault ===
  log('═══════════════════════════════════════════════════', 'yellow');
  log('ETAPA 2: Inicializar Vault', 'yellow');
  log('═══════════════════════════════════════════════════', 'yellow');
  console.log('');

  const initVaultScript = path.join(__dirname, '..', 'vault', 'init-vault.js');

  if (fs.existsSync(initVaultScript)) {
    log('🔐 Configurando Vault...', 'blue');
    exec(`node "${initVaultScript}"`);
  } else {
    log('⚠️  Script init-vault.js não encontrado, pulando...', 'yellow');
  }

  console.log('');

  // === ETAPA 3: Criar Backup Inicial ===
  log('═══════════════════════════════════════════════════', 'yellow');
  log('ETAPA 3: Criar Backup Inicial', 'yellow');
  log('═══════════════════════════════════════════════════', 'yellow');
  console.log('');

  const backupDir = process.env.BACKUP_DIR || './backups';

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupScript = path.join(__dirname, '..', 'backup', 'backup-postgres.js');

  if (fs.existsSync(backupScript)) {
    log('💾 Criando backup inicial...', 'blue');
    exec(`node "${backupScript}"`);
  } else {
    log('⚠️  Script backup-postgres.js não encontrado, pulando...', 'yellow');
  }

  // === Conclusão ===
  console.log('');
  log('═══════════════════════════════════════════════════', 'green');
  log('✅ SETUP CONCLUÍDO COM SUCESSO!', 'green');
  log('═══════════════════════════════════════════════════', 'green');
  console.log('');

  log('📋 Resumo:', 'blue');
  console.log('');

  log('  🔐 Vault UI:', 'green');
  console.log('     http://localhost:8200/ui');
  console.log('     Token: fayol-dev-root-token');
  console.log('');

  log('  🗄️  Backup Automático:', 'green');
  console.log('     Frequência: Diário (01:00 AM)');
  console.log('     Retenção: 7 dias, 4 semanas, 6 meses');
  console.log('     Localização: Volume Docker postgres_backups');
  console.log('');

  log('  💾 Backup Manual:', 'green');
  console.log(`     Diretório: ${backupDir}`);
  console.log('');

  log('🔍 Verificar Status:', 'blue');
  console.log('  docker-compose ps');
  console.log('  docker logs fayol_vault');
  console.log('  docker logs fayol_postgres_backup');
  console.log('');

  log('📚 Documentação:', 'blue');
  console.log('  docs/VAULT_BACKUP_GUIDE.md');
  console.log('  scripts/README.md');
  console.log('');

  log('⚠️  IMPORTANTE (PRODUÇÃO):', 'yellow');
  log('  1. Mudar VAULT_ROOT_TOKEN no .env', 'red');
  console.log('  2. Configurar Vault com storage persistente (não -dev)');
  console.log('  3. Habilitar TLS/HTTPS');
  console.log('  4. Configurar backup offsite (S3/GCS)');
  console.log('');
}

main().catch((error) => {
  console.error('');
  log(`❌ Erro: ${error.message}`, 'red');
  process.exit(1);
});
