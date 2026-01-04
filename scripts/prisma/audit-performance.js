#!/usr/bin/env node

/**
 * Fayol - Prisma Performance Audit
 *
 * Executa auditoria completa de performance do Prisma:
 * - Valida schema
 * - Verifica migrations pendentes
 * - Analisa índices
 * - Estatísticas do schema
 * - Recomendações de otimização
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

function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
  } catch (error) {
    if (!options.ignoreError) throw error;
    return '';
  }
}

function main() {
  console.log('');
  log('🔎 Fayol - Prisma Performance Audit', 'yellow');
  console.log('================================================');
  console.log('');

  // Navega para o diretório database-models
  const dbModelsDir = path.join(__dirname, '..', '..', 'packages', 'database-models');
  const schemaPath = path.join(dbModelsDir, 'prisma', 'schema.prisma');

  if (!fs.existsSync(schemaPath)) {
    log('❌ Schema do Prisma não encontrado!', 'red');
    log(`   Esperado em: ${schemaPath}`, 'yellow');
    process.exit(1);
  }

  log('📋 Executando auditoria completa...', 'blue');
  console.log('');

  // 1. Validar schema
  log('1. Validando Prisma Schema...', 'yellow');
  try {
    const output = exec('npx prisma validate', {
      cwd: dbModelsDir,
      silent: true,
    });
    if (!output.includes('error')) {
      log('   ✓ Schema válido', 'green');
    }
  } catch (error) {
    log('   ✗ Schema inválido!', 'red');
    console.log(error.stdout || error.message);
  }
  console.log('');

  // 2. Verificar migrations
  log('2. Verificando migrations...', 'yellow');
  try {
    const migrationStatus = exec('npx prisma migrate status', {
      cwd: dbModelsDir,
      silent: true,
      ignoreError: true,
    });

    if (migrationStatus.includes('up to date')) {
      log('   ✓ Todas as migrations aplicadas', 'green');
    } else if (migrationStatus.includes('pending')) {
      log('   ✗ Há migrations pendentes!', 'red');
      log('     Execute: npx prisma migrate deploy', 'blue');
    } else {
      log('   ⚠ Status desconhecido (banco pode estar offline)', 'yellow');
    }
  } catch (error) {
    log('   ⚠ Não foi possível verificar migrations', 'yellow');
  }
  console.log('');

  // 3. Analisar schema
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const lines = schemaContent.split('\n');

  const indexCount = (schemaContent.match(/@@index/g) || []).length;
  const uniqueCount = (schemaContent.match(/@@unique|@unique/g) || []).length;

  log('3. Analisando índices...', 'yellow');
  log(`   Índices encontrados:    ${indexCount}`, 'blue');
  log(`   Constraints únicos:     ${uniqueCount}`, 'blue');
  console.log('');

  // 4. Verificar relações
  const relationCount = (schemaContent.match(/@relation/g) || []).length;

  log('4. Verificando relações...', 'yellow');
  log(`   Total de relações:      ${relationCount}`, 'blue');
  console.log('');

  // 5. Estatísticas do schema
  const modelCount = (schemaContent.match(/^model /gm) || []).length;
  const enumCount = (schemaContent.match(/^enum /gm) || []).length;
  const fieldCount = (schemaContent.match(/^\s+\w+\s/gm) || []).length;

  log('5. Estatísticas do Schema...', 'yellow');
  log(`   Models:                 ${modelCount}`, 'blue');
  log(`   Enums:                  ${enumCount}`, 'blue');
  log(`   Campos (aproximado):    ${fieldCount}`, 'blue');
  console.log('');

  // 6. Verificar Prisma Client
  log('6. Verificando Prisma Client...', 'yellow');
  const nodeModulesPath = path.join(__dirname, '..', '..', 'node_modules');
  const prismaClientPath = path.join(nodeModulesPath, '.prisma', 'client');

  if (fs.existsSync(prismaClientPath)) {
    log('   ✓ Prisma Client gerado', 'green');

    try {
      const stats = execSync(`du -sh "${prismaClientPath}" 2>/dev/null || echo "0"`, {
        encoding: 'utf-8',
        shell: process.platform === 'win32' ? 'bash' : undefined,
      }).trim();

      if (stats && stats !== '0') {
        log(`   Tamanho:                ${stats.split('\t')[0]}`, 'blue');
      }
    } catch {
      // Tamanho não disponível no Windows sem Git Bash
    }
  } else {
    log('   ✗ Prisma Client não encontrado', 'red');
    log('     Execute: npx prisma generate', 'blue');
  }
  console.log('');

  // 7. Recomendações
  log('📊 Recomendações de Performance:', 'yellow');
  console.log('================================================');
  console.log('');

  if (indexCount < 5) {
    log(`⚠️  Poucos índices detectados (${indexCount})`, 'yellow');
    console.log('   Considere adicionar índices em:');
    console.log('   • Campos de filtro frequente (WHERE)');
    console.log('   • Campos de ordenação (ORDER BY)');
    console.log('   • Campos de junção (JOIN)');
    console.log('');
  }

  if (modelCount > 50) {
    log(`⚠️  Schema grande (${modelCount} models)`, 'yellow');
    console.log('   Considere:');
    console.log('   • Separar em schemas menores');
    console.log('   • Usar views do Prisma');
    console.log('');
  }

  log('💡 Comandos úteis:', 'blue');
  console.log('   npx prisma studio          - Interface visual do banco');
  console.log('   npx prisma db seed          - Popular banco com dados de teste');
  console.log('   npx prisma migrate dev      - Criar nova migration');
  console.log('   DEBUG=prisma:* pnpm dev    - Debug mode completo');
  console.log('');

  log('✅ Auditoria completa!', 'green');
  console.log('');
}

try {
  main();
} catch (error) {
  log(`Erro durante auditoria: ${error.message}`, 'red');
  process.exit(1);
}
