#!/usr/bin/env node

/**
 * Fayol - Prisma Query Analyzer
 *
 * Analisa logs de queries do Prisma para identificar:
 * - Queries mais executadas
 * - Queries lentas
 * - Possíveis N+1 queries
 * - Estatísticas de uso
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

function analyzeLogFile(logPath) {
  console.log('');
  log('📊 Fayol - Prisma Query Analyzer', 'yellow');
  console.log('================================================');
  console.log('');

  // Verifica se arquivo existe
  if (!fs.existsSync(logPath)) {
    log(`Arquivo de log não encontrado: ${logPath}`, 'red');
    console.log('');
    log('Para capturar logs:', 'blue');
    console.log('  DEBUG="prisma:query" pnpm run dev 2>&1 | tee prisma-queries.log');
    process.exit(1);
  }

  log(`Analisando: ${logPath}`, 'green');
  console.log('');

  // Lê arquivo
  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n');

  // Extrai queries
  const queries = lines
    .filter((line) => line.includes('prisma:query'))
    .map((line) => line.replace(/.*prisma:query\s+/, '').trim())
    .filter((q) => q.length > 0);

  // Análise 1: Queries mais executadas
  console.log('');
  log('📈 Top 10 Queries Mais Executadas:', 'yellow');
  console.log('================================================');

  const selectQueries = queries.filter((q) => q.includes('SELECT'));
  const queryCounts = {};

  selectQueries.forEach((query) => {
    // Normaliza query removendo valores específicos
    const normalized = query
      .replace(/\d+/g, 'N')
      .replace(/'[^']*'/g, "'VALUE'")
      .substring(0, 100);

    queryCounts[normalized] = (queryCounts[normalized] || 0) + 1;
  });

  const topQueries = Object.entries(queryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  topQueries.forEach(([query, count], index) => {
    console.log(`${index + 1}. (${count}x) ${query}...`);
  });

  if (topQueries.length === 0) {
    console.log('  Nenhuma query SELECT encontrada');
  }

  // Análise 2: Queries lentas
  console.log('');
  log('🐌 Queries Lentas (se disponível):', 'yellow');
  console.log('================================================');

  const slowQueries = lines.filter((line) => line.match(/duration.*ms/i)).slice(0, 10);

  if (slowQueries.length > 0) {
    slowQueries.forEach((q) => console.log(`  ${q}`));
  } else {
    console.log('  Nenhuma informação de duração encontrada');
  }

  // Análise 3: Estatísticas
  const totalQueries = queries.length;
  const selectCount = queries.filter((q) => q.includes('SELECT')).length;
  const insertCount = queries.filter((q) => q.includes('INSERT')).length;
  const updateCount = queries.filter((q) => q.includes('UPDATE')).length;
  const deleteCount = queries.filter((q) => q.includes('DELETE')).length;

  console.log('');
  log('📊 Estatísticas:', 'yellow');
  console.log('================================================');
  log(`  Total de queries:   ${totalQueries}`, 'green');
  log(`  SELECT:             ${selectCount}`, 'blue');
  log(`  INSERT:             ${insertCount}`, 'green');
  log(`  UPDATE:             ${updateCount}`, 'yellow');
  log(`  DELETE:             ${deleteCount}`, 'red');
  console.log('');

  // Análise 4: Detecção de N+1
  console.log('');
  log('⚠️  Possíveis N+1 Queries:', 'yellow');
  console.log('================================================');

  const whereQueries = queries.filter((q) => q.includes('SELECT') && q.includes('WHERE'));

  // Agrupa queries similares
  const patternCounts = {};
  whereQueries.forEach((query) => {
    const pattern = query
      .replace(/\d+/g, 'N')
      .replace(/'[^']*'/g, "'?'")
      .substring(0, 80);
    patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
  });

  const potentialN1 = Object.entries(patternCounts)
    .filter(([, count]) => count > 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (potentialN1.length > 0) {
    potentialN1.forEach(([pattern, count]) => {
      console.log(`  ${count}x vezes: ${pattern}...`);
    });
  } else {
    console.log('  Nenhum padrão N+1 detectado');
  }

  console.log('');
  log('✅ Análise completa!', 'green');
  console.log('');
  log('Dicas para otimização:', 'blue');
  console.log("  • Use 'include' para evitar N+1 queries");
  console.log('  • Considere adicionar índices para queries frequentes');
  console.log("  • Use 'select' para buscar apenas campos necessários");
  console.log('  • Implemente DataLoader para batch requests');
  console.log('');
}

// Main
const logFile = process.argv[2] || 'prisma-queries.log';
const logPath = path.resolve(logFile);

try {
  analyzeLogFile(logPath);
} catch (error) {
  log(`Erro ao analisar arquivo: ${error.message}`, 'red');
  process.exit(1);
}
