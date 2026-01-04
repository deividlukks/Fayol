#!/usr/bin/env node

/**
 * Fayol - Restore do PostgreSQL
 *
 * Restaura backup do banco de dados PostgreSQL a partir de arquivo .sql.gz
 * ATENÇÃO: Esta operação SOBRESCREVE o banco de dados atual!
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31',
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
      ...options,
    });
  } catch (error) {
    if (!options.ignoreError) {
      throw new Error(`Comando falhou: ${command}\n${error.message}`);
    }
    return '';
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function confirmRestore() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log('');
    log('⚠️  ATENÇÃO: Esta ação irá SOBRESCREVER o banco de dados atual!', 'red');
    console.log('');
    rl.question("Deseja continuar? (digite 'CONFIRMO' para prosseguir): ", (answer) => {
      rl.close();
      resolve(answer.trim() === 'CONFIRMO');
    });
  });
}

function listBackups() {
  const backupDir = process.env.BACKUP_DIR || path.join(__dirname, '..', '..', 'backups');

  console.log('');
  log('📋 Backups disponíveis:', 'blue');
  console.log('');

  if (!fs.existsSync(backupDir)) {
    log(`❌ Diretório de backups não encontrado: ${backupDir}`, 'red');
    process.exit(1);
  }

  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith('fayol_backup_') && f.endsWith('.sql.gz'))
    .map((f) => {
      const filepath = path.join(backupDir, f);
      const stat = fs.statSync(filepath);
      return {
        name: f,
        path: filepath,
        size: formatBytes(stat.size),
        date: stat.mtime,
      };
    })
    .sort((a, b) => b.date - a.date)
    .slice(0, 10);

  if (files.length === 0) {
    log(`❌ Nenhum backup encontrado em ${backupDir}`, 'red');
    process.exit(1);
  }

  files.forEach((file, index) => {
    const dateStr = file.date.toLocaleString('pt-BR');
    console.log(`${index + 1}. ${file.name}`);
    console.log(`   Tamanho: ${file.size} | Data: ${dateStr}`);
    console.log(`   Path: ${file.path}`);
    console.log('');
  });

  console.log('');
  log('Uso:', 'yellow');
  console.log('  node scripts/backup/restore-postgres.js <arquivo_backup.sql.gz>');
  console.log('');
  log('Exemplo:', 'yellow');
  console.log(`  node scripts/backup/restore-postgres.js ${files[0].path}`);
  console.log('');
}

async function main() {
  console.log('');
  log('🔄 Fayol - Restore PostgreSQL', 'yellow');
  console.log('================================================');
  console.log('');

  // Verifica se foi passado um arquivo
  const backupFile = process.argv[2];

  if (!backupFile) {
    listBackups();
    process.exit(0);
  }

  // Verifica se arquivo existe
  if (!fs.existsSync(backupFile)) {
    log(`❌ Erro: Arquivo '${backupFile}' não encontrado!`, 'red');
    process.exit(1);
  }

  const containerName = 'fayol_postgres';
  const postgresUser = process.env.POSTGRES_USER || 'fayol_admin';

  // Verifica se container está rodando
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
    process.exit(1);
  }

  // Confirma ação
  const confirmed = await confirmRestore();

  if (!confirmed) {
    log('❌ Operação cancelada.', 'yellow');
    process.exit(0);
  }

  console.log('');
  log('🔄 Restaurando backup...', 'yellow');
  console.log(`   Arquivo: ${backupFile}`);
  console.log('');

  try {
    // Para serviços dependentes
    log('⏸️  Parando serviços dependentes...', 'yellow');
    exec('docker-compose stop backend web-app telegram-bot', {
      silent: true,
      ignoreError: true,
    });

    console.log('');
    log('📥 Executando restore...', 'yellow');

    // Restaura backup
    // No Windows, precisamos usar cmd /c para pipe funcionar corretamente
    const isWindows = process.platform === 'win32';

    if (isWindows) {
      // Versão Windows
      exec(
        `type "${backupFile}" | docker exec -i ${containerName} sh -c "gunzip | psql -U ${postgresUser} -d postgres"`,
        { shell: 'cmd.exe' }
      );
    } else {
      // Versão Linux/Mac
      exec(
        `gunzip < "${backupFile}" | docker exec -i ${containerName} psql -U ${postgresUser} -d postgres`
      );
    }

    console.log('');
    log('✅ Restore concluído com sucesso!', 'green');
    console.log('');

    // Reinicia serviços
    log('🔄 Reiniciando serviços...', 'yellow');
    exec('docker-compose up -d backend web-app telegram-bot', {
      silent: true,
      ignoreError: true,
    });

    console.log('');
    log('✨ Restore finalizado!', 'green');
    console.log('');
  } catch (error) {
    log('❌ Erro ao executar restore:', 'red');
    console.error(error.message);
    process.exit(1);
  }
}

main();
