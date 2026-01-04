#!/usr/bin/env node

/**
 * Fayol - Backup Manual do PostgreSQL
 *
 * Cria backup compactado do banco de dados PostgreSQL
 * rodando em container Docker.
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
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
  } catch (error) {
    throw new Error(`Comando falhou: ${command}\n${error.message}`);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function main() {
  console.log('');
  log('🗄️  Fayol - Backup PostgreSQL', 'yellow');
  console.log('================================================');
  console.log('');

  // Configurações
  const backupDir = process.env.BACKUP_DIR || path.join(__dirname, '..', '..', 'backups');
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .split('T')
    .join('_')
    .split('.')[0];
  const backupFile = `fayol_backup_${timestamp}.sql.gz`;
  const backupPath = path.join(backupDir, backupFile);

  const containerName = 'fayol_postgres';
  const postgresUser = process.env.POSTGRES_USER || 'fayol_admin';
  const postgresDb = process.env.POSTGRES_DB || 'fayol_db';

  // Cria diretório de backup se não existir
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Verifica se o container está rodando
  log('Verificando container PostgreSQL...', 'cyan');
  try {
    const containers = exec('docker ps', { silent: true });
    if (!containers.includes(containerName)) {
      log(`❌ Erro: Container ${containerName} não está rodando!`, 'red');
      console.log('   Execute: docker-compose up -d postgres');
      process.exit(1);
    }
    log('✓ Container encontrado', 'green');
  } catch (error) {
    log('❌ Erro ao verificar Docker', 'red');
    console.log('   Certifique-se de que o Docker está rodando');
    process.exit(1);
  }

  console.log('');
  log('📦 Criando backup...', 'yellow');
  console.log(`   Arquivo: ${backupFile}`);
  console.log(`   Destino: ${backupDir}`);
  console.log('');

  try {
    // No Windows, fazemos o dump dentro do container e depois copiamos
    const tempFile = `/tmp/${backupFile}`;

    // 1. Executa dump e compressão dentro do container
    exec(
      `docker exec ${containerName} sh -c "pg_dump -U ${postgresUser} -d ${postgresDb} --clean --if-exists --create --no-owner --no-acl | gzip > ${tempFile}"`,
      { silent: true }
    );

    // 2. Copia do container para o host
    exec(`docker cp ${containerName}:${tempFile} "${backupPath}"`, { silent: true });

    // 3. Remove arquivo temporário do container
    exec(`docker exec ${containerName} rm ${tempFile}`, { silent: true, ignoreError: true });

    // Verifica se o backup foi criado
    if (fs.existsSync(backupPath)) {
      const stats = fs.statSync(backupPath);
      const size = formatBytes(stats.size);

      log('✅ Backup criado com sucesso!', 'green');
      console.log(`   Tamanho: ${size}`);
      console.log(`   Path: ${backupPath}`);
      console.log('');

      // Lista backups recentes
      log('📋 Últimos 5 backups:', 'yellow');
      const files = fs
        .readdirSync(backupDir)
        .filter((f) => f.startsWith('fayol_backup_') && f.endsWith('.sql.gz'))
        .map((f) => {
          const filepath = path.join(backupDir, f);
          const stat = fs.statSync(filepath);
          return {
            name: f,
            size: formatBytes(stat.size),
            date: stat.mtime,
          };
        })
        .sort((a, b) => b.date - a.date)
        .slice(0, 5);

      files.forEach((file) => {
        const dateStr = file.date.toLocaleString('pt-BR');
        console.log(`   ${file.name} (${file.size}) - ${dateStr}`);
      });

      console.log('');
      log('✨ Backup concluído!', 'green');
      console.log('');
    } else {
      log('❌ Erro ao criar backup!', 'red');
      process.exit(1);
    }
  } catch (error) {
    log('❌ Erro durante backup:', 'red');
    console.error(error.message);
    process.exit(1);
  }
}

main();
