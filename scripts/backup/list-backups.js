#!/usr/bin/env node

/**
 * Fayol - Lista Backups Disponíveis
 *
 * Lista todos os backups do PostgreSQL com informações detalhadas
 */

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

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function main() {
  console.log('');
  log('📋 Fayol - Lista de Backups', 'yellow');
  console.log('================================================');
  console.log('');

  const backupDir = process.env.BACKUP_DIR || path.join(__dirname, '..', '..', 'backups');

  if (!fs.existsSync(backupDir)) {
    log(`❌ Diretório de backups não encontrado: ${backupDir}`, 'red');
    console.log('');
    log('Crie um backup primeiro:', 'yellow');
    console.log('  node scripts/backup/backup-postgres.js');
    console.log('');
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
        size: stat.size,
        sizeFormatted: formatBytes(stat.size),
        date: stat.mtime,
      };
    })
    .sort((a, b) => b.date - a.date);

  if (files.length === 0) {
    log(`📭 Nenhum backup encontrado em ${backupDir}`, 'yellow');
    console.log('');
    log('Crie um backup primeiro:', 'blue');
    console.log('  node scripts/backup/backup-postgres.js');
    console.log('');
    process.exit(0);
  }

  log(`Diretório: ${backupDir}`, 'cyan');
  log(`Total de backups: ${files.length}`, 'cyan');
  console.log('');

  // Calcula espaço total
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  log(`Espaço total: ${formatBytes(totalSize)}`, 'cyan');
  console.log('');
  console.log('================================================');
  console.log('');

  files.forEach((file, index) => {
    const dateStr = file.date.toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const age = getAge(file.date);

    log(`${index + 1}. ${file.name}`, 'green');
    console.log(`   Tamanho: ${file.sizeFormatted}`);
    console.log(`   Data:    ${dateStr} (${age})`);
    console.log(`   Path:    ${file.path}`);
    console.log('');
  });

  console.log('================================================');
  console.log('');
  log('💡 Comandos úteis:', 'blue');
  console.log('   Criar backup:');
  console.log('     node scripts/backup/backup-postgres.js');
  console.log('');
  console.log('   Restaurar backup:');
  console.log(
    `     node scripts/backup/restore-postgres.js "${files[0]?.path || 'backup.sql.gz'}"`
  );
  console.log('');
}

function getAge(date) {
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) {
    return `há ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  } else if (hours < 24) {
    return `há ${hours} hora${hours !== 1 ? 's' : ''}`;
  } else if (days < 30) {
    return `há ${days} dia${days !== 1 ? 's' : ''}`;
  } else {
    const months = Math.floor(days / 30);
    return `há ${months} mês${months !== 1 ? 'es' : ''}`;
  }
}

main();
