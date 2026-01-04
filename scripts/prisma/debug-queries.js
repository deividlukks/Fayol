#!/usr/bin/env node

/**
 * Fayol - Prisma Debug Mode
 *
 * Inicia a aplicação com diferentes níveis de logging do Prisma
 * para debug e análise de performance.
 */

const { execSync } = require('child_process');
const path = require('path');
const readline = require('readline');

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

function showMenu() {
  console.log('');
  log('🔍 Fayol - Prisma Debug Mode', 'yellow');
  console.log('================================================');
  console.log('');
  log('Modos de Debug Disponíveis:', 'blue');
  console.log('  1. Query Logging            - Log todas as queries SQL');
  console.log('  2. Error Logging            - Log apenas erros');
  console.log('  3. Info Logging             - Log informações gerais');
  console.log('  4. Warn Logging             - Log warnings');
  console.log('  5. All Logging              - Log TUDO (query + info + warn + error)');
  console.log('  6. Performance Tracing      - Analisa performance das queries');
  console.log('');
}

async function promptChoice() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Escolha uma opção (1-6): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  showMenu();

  const option = await promptChoice();

  let debugEnv = '';
  let extraEnv = {};
  let modeName = '';

  switch (option) {
    case '1':
      debugEnv = 'prisma:query';
      modeName = 'Query Logging';
      break;
    case '2':
      debugEnv = 'prisma:error';
      modeName = 'Error Logging';
      break;
    case '3':
      debugEnv = 'prisma:info';
      modeName = 'Info Logging';
      break;
    case '4':
      debugEnv = 'prisma:warn';
      modeName = 'Warn Logging';
      break;
    case '5':
      debugEnv = 'prisma:*';
      modeName = 'All Logging';
      break;
    case '6':
      debugEnv = 'prisma:engine';
      extraEnv.PRISMA_SHOW_ALL_TRACES = '1';
      modeName = 'Performance Tracing';
      break;
    default:
      log('Opção inválida!', 'red');
      process.exit(1);
  }

  console.log('');
  log(`Ativando ${modeName}...`, 'green');
  console.log('');
  log('Iniciando aplicação com debug...', 'yellow');
  console.log('');
  log('Variáveis de ambiente ativas:', 'blue');
  console.log(`  DEBUG=${debugEnv}`);
  if (extraEnv.PRISMA_SHOW_ALL_TRACES) {
    console.log(`  PRISMA_SHOW_ALL_TRACES=${extraEnv.PRISMA_SHOW_ALL_TRACES}`);
  }
  console.log('');
  log('Pressione Ctrl+C para parar', 'yellow');
  console.log('================================================');
  console.log('');

  // Navega para o diretório do backend
  const backendDir = path.join(__dirname, '..', '..', 'apps', 'backend');

  // Inicia o backend com debug
  const env = {
    ...process.env,
    DEBUG: debugEnv,
    ...extraEnv,
  };

  try {
    execSync('pnpm run dev', {
      cwd: backendDir,
      stdio: 'inherit',
      env,
    });
  } catch (error) {
    // Ctrl+C é esperado, não é erro
    if (error.signal === 'SIGINT') {
      console.log('');
      log('Debug encerrado.', 'green');
      process.exit(0);
    }
    throw error;
  }
}

main().catch((error) => {
  log(`Erro: ${error.message}`, 'red');
  process.exit(1);
});
