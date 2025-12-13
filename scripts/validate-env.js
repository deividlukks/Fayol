#!/usr/bin/env node

/**
 * Script de Validação de Ambiente - Projeto Fayol
 *
 * Valida se o ambiente de desenvolvimento está configurado corretamente antes de executar a aplicação.
 *
 * Verifica:
 * - Versão do Node.js
 * - Versão do PNPM
 * - Variáveis de ambiente obrigatórias
 * - Existência do arquivo .env
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Diretório raiz do projeto (onde está o package.json principal)
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Emojis para melhor visualização
const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

let hasErrors = false;
let hasWarnings = false;

/**
 * Imprime mensagem colorida
 */
function log(message, color = 'reset', icon = null) {
  const prefix = icon ? `${icon}  ` : '';
  console.log(`${colors[color]}${prefix}${message}${colors.reset}`);
}

/**
 * Imprime cabeçalho de seção
 */
function header(title) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  log(title, 'cyan');
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

/**
 * Verifica versão do Node.js
 */
function checkNodeVersion() {
  header('Verificando Node.js');

  try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    if (majorVersion >= 20) {
      log(`Node.js versão: ${nodeVersion}`, 'green', icons.success);
    } else {
      log(`Node.js versão: ${nodeVersion} (mínimo: v20.0.0)`, 'red', icons.error);
      hasErrors = true;
    }
  } catch (error) {
    log('Erro ao verificar versão do Node.js', 'red', icons.error);
    hasErrors = true;
  }
}

/**
 * Verifica versão do PNPM
 */
function checkPnpmVersion() {
  header('Verificando PNPM');

  try {
    const pnpmVersion = execSync('pnpm --version', { encoding: 'utf-8' }).trim();
    const majorVersion = parseInt(pnpmVersion.split('.')[0]);

    if (majorVersion >= 9) {
      log(`PNPM versão: ${pnpmVersion}`, 'green', icons.success);
    } else {
      log(`PNPM versão: ${pnpmVersion} (mínimo: v9.0.0)`, 'red', icons.error);
      hasErrors = true;
    }
  } catch (error) {
    log('PNPM não está instalado', 'red', icons.error);
    log('Instale com: npm install -g pnpm', 'yellow');
    hasErrors = true;
  }
}

/**
 * Verifica existência do arquivo .env
 */
function checkEnvFile() {
  header('Verificando arquivo .env');

  const envPath = path.join(PROJECT_ROOT, '.env');
  const envExamplePath = path.join(PROJECT_ROOT, '.env.example');

  if (fs.existsSync(envPath)) {
    log('Arquivo .env encontrado', 'green', icons.success);
  } else {
    log('Arquivo .env não encontrado', 'red', icons.error);

    if (fs.existsSync(envExamplePath)) {
      log('Copie o .env.example para .env e preencha os valores:', 'yellow', icons.info);
      log('  cp .env.example .env', 'yellow');
    }

    hasErrors = true;
  }
}

/**
 * Carrega e parse arquivo .env
 */
function loadEnvFile() {
  const envPath = path.join(PROJECT_ROOT, '.env');

  if (!fs.existsSync(envPath)) {
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach((line) => {
    line = line.trim();

    // Ignorar comentários e linhas vazias
    if (!line || line.startsWith('#')) {
      return;
    }

    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');

    if (key) {
      env[key] = value;
    }
  });

  return env;
}

/**
 * Verifica variáveis de ambiente obrigatórias
 */
function checkEnvVariables() {
  header('Verificando Variáveis de Ambiente');

  const env = loadEnvFile();

  // Variáveis obrigatórias
  const requiredVars = {
    DATABASE_URL: {
      description: 'URL de conexão com PostgreSQL',
      example: 'postgresql://user:pass@localhost:5432/db',
    },
    JWT_SECRET: {
      description: 'Secret para geração de tokens JWT',
      example: 'seu-secret-super-seguro-aqui',
      validate: (value) => value.length >= 32,
      errorMessage: 'JWT_SECRET deve ter no mínimo 32 caracteres',
    },
    TELEGRAM_BOT_TOKEN: {
      description: 'Token do bot do Telegram (@BotFather)',
      example: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
    },
  };

  // Variáveis opcionais mas recomendadas
  const optionalVars = {
    REDIS_HOST: {
      description: 'Host do Redis',
      default: 'localhost',
    },
    REDIS_PORT: {
      description: 'Porta do Redis',
      default: '6379',
    },
    PORT_BACKEND: {
      description: 'Porta do backend',
      default: '3333',
    },
    PORT_WEB: {
      description: 'Porta do frontend',
      default: '3000',
    },
    PORT_AI: {
      description: 'Porta do serviço de IA',
      default: '8000',
    },
  };

  // Verificar variáveis obrigatórias
  let missingRequired = false;

  for (const [key, config] of Object.entries(requiredVars)) {
    const value = env[key] || process.env[key];

    if (!value || value.includes('your_') || value.includes('change_me')) {
      log(`${key}: NÃO CONFIGURADO`, 'red', icons.error);
      log(`  Descrição: ${config.description}`, 'yellow');
      log(`  Exemplo: ${config.example}`, 'yellow');
      missingRequired = true;
      hasErrors = true;
    } else if (config.validate && !config.validate(value)) {
      log(`${key}: INVÁLIDO`, 'red', icons.error);
      log(`  ${config.errorMessage}`, 'yellow');
      hasErrors = true;
    } else {
      const maskedValue =
        key.includes('SECRET') || key.includes('TOKEN') || key.includes('PASSWORD')
          ? value.substring(0, 10) + '...'
          : value;
      log(`${key}: ${maskedValue}`, 'green', icons.success);
    }
  }

  // Verificar variáveis opcionais
  console.log();
  log('Variáveis Opcionais:', 'blue');

  for (const [key, config] of Object.entries(optionalVars)) {
    const value = env[key] || process.env[key] || config.default;

    if (!env[key] && !process.env[key]) {
      log(`${key}: ${value} (padrão)`, 'yellow', icons.warning);
      hasWarnings = true;
    } else {
      log(`${key}: ${value}`, 'green', icons.success);
    }
  }
}

/**
 * Verifica se Docker está rodando (opcional)
 */
function checkDocker() {
  header('Verificando Docker (Opcional)');

  try {
    execSync('docker --version', { encoding: 'utf-8', stdio: 'pipe' });
    log('Docker está instalado', 'green', icons.success);

    try {
      execSync('docker ps', { encoding: 'utf-8', stdio: 'pipe' });
      log('Docker daemon está rodando', 'green', icons.success);
    } catch (error) {
      log('Docker daemon não está rodando', 'yellow', icons.warning);
      log('Inicie o Docker Desktop se quiser usar containers', 'yellow');
      hasWarnings = true;
    }
  } catch (error) {
    log('Docker não está instalado', 'yellow', icons.warning);
    log('Docker é opcional para desenvolvimento local', 'yellow');
    hasWarnings = true;
  }
}

/**
 * Exibe resumo final
 */
function displaySummary() {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  log('RESUMO DA VALIDAÇÃO', 'cyan');
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

  if (hasErrors) {
    log('Validação FALHOU', 'red', icons.error);
    log('Corrija os erros acima antes de continuar', 'red');
    process.exit(1);
  } else if (hasWarnings) {
    log('Validação concluída com avisos', 'yellow', icons.warning);
    log('Ambiente está funcional, mas algumas configurações opcionais estão faltando', 'yellow');
    process.exit(0);
  } else {
    log('Validação concluída com sucesso!', 'green', icons.success);
    log('Ambiente está pronto para desenvolvimento', 'green');
    process.exit(0);
  }
}

/**
 * Executa todas as validações
 */
function main() {
  console.log(`\n${colors.blue}╔${'═'.repeat(58)}╗${colors.reset}`);
  log('║  🔍  VALIDAÇÃO DE AMBIENTE - PROJETO FAYOL           ║', 'blue');
  console.log(`${colors.blue}╚${'═'.repeat(58)}╝${colors.reset}\n`);

  checkNodeVersion();
  checkPnpmVersion();
  checkEnvFile();
  checkEnvVariables();
  checkDocker();
  displaySummary();
}

// Executar script
main();
