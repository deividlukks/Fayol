#!/usr/bin/env node

/**
 * Cleanup Script - Mata processos e libera portas
 *
 * Uso:
 *   node scripts/cleanup.js              # Cleanup padrão (portas Fayol)
 *   node scripts/cleanup.js --all        # Mata todos os processos Node
 *   node scripts/cleanup.js --force      # Força encerramento
 */

const { execSync } = require('child_process');
const os = require('os');

const isWindows = os.platform() === 'win32';
const args = process.argv.slice(2);
const cleanupAll = args.includes('--all');
const forceKill = args.includes('--force');

// Portas do projeto Fayol
const FAYOL_PORTS = [3000, 3001, 3003, 5555];

// Cores
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(text) {
  console.log('\n' + '='.repeat(60));
  log(text, 'cyan');
  console.log('='.repeat(60));
}

/**
 * Obtém PIDs usando uma porta
 */
function getPidsUsingPort(port) {
  try {
    let cmd;
    if (isWindows) {
      cmd = `netstat -ano | findstr :${port}`;
    } else {
      cmd = `lsof -ti :${port}`;
    }

    const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });

    if (!output.trim()) {
      return [];
    }

    const pids = new Set();

    if (isWindows) {
      const lines = output.trim().split('\n');
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid)) {
          pids.add(parseInt(pid));
        }
      });
    } else {
      output.trim().split('\n').forEach(pid => {
        if (pid && !isNaN(pid)) {
          pids.add(parseInt(pid));
        }
      });
    }

    return Array.from(pids);
  } catch (error) {
    return [];
  }
}

/**
 * Mata um processo
 */
function killProcess(pid) {
  try {
    let cmd;
    if (isWindows) {
      cmd = `taskkill ${forceKill ? '/F' : ''} /PID ${pid}`;
    } else {
      cmd = `kill ${forceKill ? '-9' : ''} ${pid}`;
    }

    execSync(cmd, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Obtém todos os PIDs de processos Node
 */
function getAllNodePids() {
  try {
    let cmd;
    if (isWindows) {
      cmd = 'tasklist /FI "IMAGENAME eq node.exe" /FO CSV /NH';
    } else {
      cmd = 'pgrep node';
    }

    const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });

    if (!output.trim()) {
      return [];
    }

    const pids = [];

    if (isWindows) {
      const lines = output.trim().split('\n');
      lines.forEach(line => {
        const parts = line.replace(/"/g, '').split(',');
        if (parts.length >= 2) {
          const pid = parseInt(parts[1]);
          if (!isNaN(pid)) {
            pids.push(pid);
          }
        }
      });
    } else {
      output.trim().split('\n').forEach(pid => {
        const parsedPid = parseInt(pid);
        if (!isNaN(parsedPid)) {
          pids.push(parsedPid);
        }
      });
    }

    return pids;
  } catch (error) {
    return [];
  }
}

/**
 * Cleanup de portas específicas
 */
function cleanupPorts(ports) {
  header('🧹 Limpando Portas do Projeto Fayol');

  let killedCount = 0;

  for (const port of ports) {
    const pids = getPidsUsingPort(port);

    if (pids.length === 0) {
      log(`✅ Porta ${port} já está livre`, 'green');
      continue;
    }

    log(`\n🔍 Porta ${port} em uso por ${pids.length} processo(s)`, 'yellow');

    for (const pid of pids) {
      const success = killProcess(pid);

      if (success) {
        log(`   ✅ Processo ${pid} encerrado`, 'green');
        killedCount++;
      } else {
        log(`   ❌ Falha ao encerrar processo ${pid}`, 'red');
      }
    }
  }

  return killedCount;
}

/**
 * Cleanup de todos os processos Node
 */
function cleanupAllNode() {
  header('🧹 Limpando TODOS os Processos Node.js');
  log('⚠️  ATENÇÃO: Isso vai encerrar TODOS os processos Node!', 'yellow');

  const pids = getAllNodePids();

  if (pids.length === 0) {
    log('✅ Nenhum processo Node.js rodando', 'green');
    return 0;
  }

  log(`\n🔍 Encontrados ${pids.length} processo(s) Node.js`, 'blue');

  let killedCount = 0;

  for (const pid of pids) {
    const success = killProcess(pid);

    if (success) {
      log(`   ✅ Processo ${pid} encerrado`, 'green');
      killedCount++;
    } else {
      log(`   ❌ Falha ao encerrar processo ${pid}`, 'red');
    }
  }

  return killedCount;
}

/**
 * Cleanup de cache e arquivos temporários
 */
function cleanupCache() {
  header('🗑️  Limpando Cache e Arquivos Temporários');

  const commands = [
    'pnpm store prune',
  ];

  let successCount = 0;

  for (const cmd of commands) {
    try {
      log(`\n📦 Executando: ${cmd}`, 'blue');
      execSync(cmd, { stdio: 'inherit' });
      log(`   ✅ Sucesso`, 'green');
      successCount++;
    } catch (error) {
      log(`   ⚠️  Comando falhou (pode ser normal se não houver cache)`, 'yellow');
    }
  }

  return successCount;
}

/**
 * Cleanup principal
 */
async function runCleanup() {
  header('🧹 FAYOL CLEANUP - Limpeza Automática do Sistema');

  let totalKilled = 0;

  if (cleanupAll) {
    // Limpar todos os processos Node
    totalKilled = cleanupAllNode();
  } else {
    // Limpar apenas portas do Fayol
    totalKilled = cleanupPorts(FAYOL_PORTS);
  }

  // Limpar cache se solicitado
  if (args.includes('--cache')) {
    cleanupCache();
  }

  // Resumo
  header('📊 RESUMO DO CLEANUP');

  if (totalKilled === 0) {
    log('✅ Sistema já estava limpo! Nenhum processo encerrado.', 'green');
  } else {
    log(`✅ Cleanup concluído! ${totalKilled} processo(s) encerrado(s).`, 'green');
  }

  log('\n💡 Dica: Execute "npm run dev" para iniciar os serviços', 'blue');

  return totalKilled > 0 ? 0 : 1;
}

// Executar
runCleanup()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    log(`\n❌ Erro ao executar cleanup: ${error.message}`, 'red');
    process.exit(1);
  });
