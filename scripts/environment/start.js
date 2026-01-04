#!/usr/bin/env node

/**
 * Fayol - Script de Inicialização Automatizada do Ambiente
 *
 * Este script automatiza a inicialização completa do ambiente de desenvolvimento:
 * - Verifica pré-requisitos (Node, PNPM, PostgreSQL, Docker)
 * - Instala dependências
 * - Configura banco de dados (migrations, seed)
 * - Inicia serviços Docker
 * - Exibe informações sobre os serviços disponíveis
 *
 * Opções:
 *   --skip-build        Pula o build dos serviços Docker
 *   --skip-migrations   Pula migrations do Prisma
 *   --fast              Modo rápido (pula build e migrations)
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
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// Parse argumentos
const args = process.argv.slice(2);
const options = {
  skipBuild: args.includes('--skip-build') || args.includes('--fast'),
  skipMigrations: args.includes('--skip-migrations') || args.includes('--fast'),
  skipDocker: false,
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(message) {
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  console.log('');
  console.log('========================================================');
  log(`[${timestamp}] >>> ${message}`, 'green');
  console.log('========================================================');
}

function exec(command, opts = {}) {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: opts.silent ? 'pipe' : 'inherit',
      cwd: opts.cwd,
      ...opts,
    });
  } catch (error) {
    if (!opts.ignoreError) throw error;
    return '';
  }
}

function checkCommand(name) {
  try {
    exec(`${name} --version`, { silent: true });
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function promptContinue(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (S/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 's');
    });
  });
}

async function main() {
  const projectRoot = path.join(__dirname, '..', '..');
  process.chdir(projectRoot);

  log(`Executando no diretório: ${projectRoot}`, 'gray');

  // === 1. Verificações Iniciais ===
  logStep('1. Verificando Pré-requisitos');

  // Verifica Node.js
  if (!checkCommand('node')) {
    log('❌ Node.js não encontrado!', 'red');
    process.exit(1);
  }
  log('✓ Node.js instalado', 'green');

  // Verifica PNPM
  if (!checkCommand('pnpm')) {
    log('❌ PNPM não encontrado!', 'red');
    log('   Instale com: npm install -g pnpm', 'yellow');
    process.exit(1);
  }
  log('✓ PNPM instalado', 'green');

  // Verifica PostgreSQL (Windows service)
  console.log('');
  log('🐘 Verificando PostgreSQL nativo...', 'cyan');

  const isWindows = process.platform === 'win32';
  let postgresRunning = false;

  if (isWindows) {
    try {
      const services = exec('sc query postgresql-x64-18', { silent: true, ignoreError: true });
      if (services.includes('RUNNING')) {
        postgresRunning = true;
        log('✓ PostgreSQL 18.1 está rodando (nativo)', 'green');
      } else if (services.includes('STOPPED')) {
        log('PostgreSQL encontrado mas não está rodando. Tentando iniciar...', 'yellow');
        exec('sc start postgresql-x64-18', { ignoreError: true });
        await sleep(3000);
        postgresRunning = true;
        log('✓ PostgreSQL iniciado', 'green');
      }
    } catch {
      log('⚠  PostgreSQL 18.1 nativo não encontrado', 'yellow');
    }
  } else {
    // Linux/Mac - tenta detectar postgres rodando
    try {
      exec('pg_isready', { silent: true, ignoreError: true });
      postgresRunning = true;
      log('✓ PostgreSQL está rodando', 'green');
    } catch {
      log('⚠  PostgreSQL pode não estar rodando', 'yellow');
    }
  }

  // Verifica Docker
  console.log('');
  log('🐳 Verificando Docker...', 'cyan');

  try {
    exec('docker ps', { silent: true });
    log('✓ Docker está rodando', 'green');
  } catch {
    log('⚠  Docker daemon não está rodando!', 'yellow');
    log('   Alguns serviços (Redis, AI, BI) não estarão disponíveis.', 'yellow');

    const continueWithoutDocker = await promptContinue('Deseja continuar sem Docker?');

    if (!continueWithoutDocker) {
      log('Operação cancelada. Inicie o Docker e tente novamente.', 'red');
      process.exit(1);
    }

    options.skipDocker = true;
  }

  // Verifica .env
  if (!fs.existsSync('.env')) {
    log('⚠  Arquivo .env não encontrado. Criando a partir de .env.example...', 'yellow');

    if (fs.existsSync('.env.example')) {
      fs.copyFileSync('.env.example', '.env');
      log('✓ .env criado com sucesso', 'green');
    } else {
      log('❌ .env.example não encontrado!', 'red');
      process.exit(1);
    }
  }

  // === 2. Instalação de Dependências ===
  logStep('2. Instalando Dependências');
  log('Sincronizando pnpm-lock.yaml...', 'cyan');
  exec('pnpm install');

  // === 3. Infraestrutura de Dados ===
  logStep('3. Iniciando Infraestrutura');

  if (!options.skipDocker) {
    log('Subindo Redis e Vault...', 'cyan');
    exec('docker-compose up -d redis vault', { ignoreError: true });

    log('Aguardando serviços ficarem saudáveis (healthcheck)...', 'cyan');
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const redisHealth = exec('docker inspect --format="{{.State.Health.Status}}" fayol_redis', {
        silent: true,
        ignoreError: true,
      }).trim();

      if (redisHealth === 'healthy' || redisHealth === '"healthy"') {
        log('✓ Infraestrutura Docker pronta!', 'green');
        break;
      }

      process.stdout.write('.');
      await sleep(2000);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      log('\n⚠  Timeout aguardando infraestrutura ficar saudável', 'yellow');
      log('   Continuando mesmo assim...', 'yellow');
    }
  } else {
    log('Docker desabilitado - pulando Redis e Vault', 'yellow');
  }

  // === 4. Configuração do Prisma ===
  logStep('4. Configurando Banco de Dados (Prisma)');

  log('Gerando Prisma Client...', 'cyan');
  exec('pnpm --filter @fayol/database-models run generate');

  if (!options.skipMigrations) {
    log('Aplicando Migrações...', 'cyan');
    try {
      exec('pnpm --filter @fayol/database-models run migrate:dev');
      log('✓ Migrations aplicadas com sucesso', 'green');
    } catch (error) {
      log('❌ Erro ao aplicar migrations', 'red');
      throw error;
    }

    log('Populando Banco de Dados (Seed)...', 'cyan');
    try {
      exec('pnpm --filter @fayol/database-models run seed');
      log('✓ Seed concluído com sucesso', 'green');
    } catch (error) {
      log('⚠  Erro ao executar seed (ignorando)', 'yellow');
    }
  } else {
    log('⚠  Migrations puladas (--skip-migrations)', 'yellow');
  }

  // === 5. Build e Start dos Serviços ===
  if (!options.skipDocker) {
    if (!options.skipBuild) {
      logStep('5. Construindo e Iniciando Serviços Docker');

      const services = [
        'python-ai',
        'bi-reports',
        'backend',
        'telegram-bot',
        'web-app',
        'admin-panel',
      ];

      for (const service of services) {
        log(`Construindo ${service}...`, 'cyan');
        exec(`docker-compose build ${service}`, { ignoreError: true });

        log(`Iniciando ${service}...`, 'cyan');
        exec(`docker-compose up -d ${service}`, { ignoreError: true });
      }
    } else {
      logStep('5. Iniciando Serviços Docker (sem build)');
      log('⚠  Build pulado (--skip-build)', 'yellow');
      exec('docker-compose up -d', { ignoreError: true });
    }
  } else {
    logStep('5. Modo sem Docker');
    log('⚠  Serviços Docker desabilitados', 'yellow');
    log('Você pode rodar localmente:', 'cyan');
    console.log('  - Backend: cd apps/backend && pnpm run dev');
    console.log('  - Web App: cd apps/web-app && pnpm run dev');
    console.log('  - Admin Panel: cd apps/admin-panel && pnpm run dev');
  }

  // === 6. Verificação Final ===
  logStep('6. Verificação de Saúde dos Serviços');
  await sleep(3000);

  if (!options.skipDocker) {
    exec('docker-compose ps', { ignoreError: true });
  }

  // === Finalização ===
  logStep('AMBIENTE INICIADO COM SUCESSO!');
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  log('🎉 SERVIÇOS DISPONÍVEIS', 'green');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');

  if (postgresRunning) {
    log('🗄️  PostgreSQL 18.1:  localhost:5432 (NATIVO)', 'green');
    log('    Database: fayol_db | User: fayol', 'cyan');
    log('    Prisma Studio: pnpm db:studio', 'cyan');
    console.log('');
  }

  if (!options.skipDocker) {
    log('🌐 Frontend Web:     http://localhost:3000', 'green');
    log('🛡️  Admin Panel:      http://localhost:3001', 'green');
    log('🔧 Backend API:      http://localhost:3333', 'green');
    log('📚 API Docs:         http://localhost:3333/api/docs', 'green');
    log('🤖 Python AI:        http://localhost:8000', 'cyan');
    log('📊 BI Reports:       http://localhost:8001', 'cyan');
    console.log('');
    log('Para ver logs: docker-compose logs -f [service-name]', 'cyan');
    log('Para parar Docker: docker-compose down', 'cyan');
  } else {
    log('🌐 Modo Local (sem Docker):', 'cyan');
    console.log('   pnpm dev                    # Todos os apps');
    console.log('   pnpm dev:web                # Apenas web-app');
    console.log('   pnpm dev:admin              # Apenas admin-panel');
    console.log('   pnpm dev:both               # Web + Admin');
  }

  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');
}

// Tratamento de erros
process.on('unhandledRejection', (error) => {
  console.error('');
  log(`❌ Erro fatal: ${error.message}`, 'red');
  log('Limpando containers...', 'yellow');
  exec('docker-compose down', { silent: true, ignoreError: true });
  process.exit(1);
});

main().catch((error) => {
  console.error('');
  log(`❌ Erro: ${error.message}`, 'red');
  process.exit(1);
});
