#!/usr/bin/env node

/**
 * Health Check Script - Detecta processos zombie e conflitos de porta
 *
 * Uso:
 *   node scripts/health-check.js
 *   npm run health-check
 */

const { execSync } = require('child_process');
const os = require('os');

// Configuração de portas esperadas
const EXPECTED_PORTS = {
  backend: 3000,
  adminPanel: 3001,
  whatsappBot: 3003,
  prismaStudio: 5555,
};

const isWindows = os.platform() === 'win32';

// Cores para output
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
 * Verifica se uma porta está em uso
 */
function checkPort(port) {
  try {
    let cmd;
    if (isWindows) {
      cmd = `netstat -ano | findstr :${port}`;
    } else {
      cmd = `lsof -i :${port} -t`;
    }

    const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });

    if (!output.trim()) {
      return null;
    }

    // Extrair PID
    let pid;
    if (isWindows) {
      const lines = output.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      const parts = lastLine.trim().split(/\s+/);
      pid = parts[parts.length - 1];
    } else {
      pid = output.trim().split('\n')[0];
    }

    return {
      port,
      pid: parseInt(pid),
      inUse: true,
    };
  } catch (error) {
    return null; // Porta livre
  }
}

/**
 * Obtém informações do processo
 */
function getProcessInfo(pid) {
  try {
    let cmd;
    if (isWindows) {
      cmd = `tasklist /FI "PID eq ${pid}" /FO CSV /NH`;
    } else {
      cmd = `ps -p ${pid} -o comm=`;
    }

    const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });

    if (isWindows) {
      const parts = output.replace(/"/g, '').split(',');
      return parts[0] || 'Unknown';
    } else {
      return output.trim();
    }
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Mata um processo
 */
function killProcess(pid, force = false) {
  try {
    let cmd;
    if (isWindows) {
      cmd = `taskkill ${force ? '/F' : ''} /PID ${pid}`;
    } else {
      cmd = `kill ${force ? '-9' : ''} ${pid}`;
    }

    execSync(cmd, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Verifica processos Node.js rodando
 */
function checkNodeProcesses() {
  try {
    let cmd;
    if (isWindows) {
      cmd = 'tasklist /FI "IMAGENAME eq node.exe" /FO CSV /NH';
    } else {
      cmd = 'ps aux | grep node | grep -v grep';
    }

    const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });

    if (!output.trim()) {
      return [];
    }

    const lines = output.trim().split('\n');
    const processes = [];

    if (isWindows) {
      for (const line of lines) {
        const parts = line.replace(/"/g, '').split(',');
        if (parts.length >= 2) {
          processes.push({
            name: parts[0],
            pid: parseInt(parts[1]),
          });
        }
      }
    } else {
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          processes.push({
            name: 'node',
            pid: parseInt(parts[1]),
          });
        }
      }
    }

    return processes;
  } catch (error) {
    return [];
  }
}

/**
 * Verifica se há processos zombie (Node sem porta associada)
 */
function detectZombieProcesses(nodeProcesses, portsInUse) {
  const activePids = new Set(portsInUse.map(p => p.pid));
  const zombies = nodeProcesses.filter(p => !activePids.has(p.pid));
  return zombies;
}

/**
 * Health Check Principal
 */
async function runHealthCheck() {
  header('🏥 FAYOL HEALTH CHECK - Verificação de Sistema');

  // 1. Verificar portas
  header('1️⃣ Verificando Portas em Uso');

  const portsInUse = [];
  const portsFree = [];

  for (const [service, port] of Object.entries(EXPECTED_PORTS)) {
    const portInfo = checkPort(port);

    if (portInfo) {
      const processName = getProcessInfo(portInfo.pid);
      portsInUse.push({ service, ...portInfo, processName });
      log(`❌ Porta ${port} (${service}) está em uso - PID ${portInfo.pid} (${processName})`, 'red');
    } else {
      portsFree.push({ service, port });
      log(`✅ Porta ${port} (${service}) está livre`, 'green');
    }
  }

  // 2. Verificar processos Node
  header('2️⃣ Verificando Processos Node.js');

  const nodeProcesses = checkNodeProcesses();

  if (nodeProcesses.length === 0) {
    log('✅ Nenhum processo Node.js rodando', 'green');
  } else {
    log(`ℹ️  ${nodeProcesses.length} processo(s) Node.js encontrado(s):`, 'blue');
    nodeProcesses.forEach(p => {
      console.log(`   - PID ${p.pid}: ${p.name}`);
    });
  }

  // 3. Detectar zombies
  header('3️⃣ Detectando Processos Zombie');

  const zombies = detectZombieProcesses(nodeProcesses, portsInUse);

  if (zombies.length === 0) {
    log('✅ Nenhum processo zombie detectado', 'green');
  } else {
    log(`⚠️  ${zombies.length} processo(s) zombie detectado(s):`, 'yellow');
    zombies.forEach(z => {
      console.log(`   - PID ${z.pid}: ${z.name} (sem porta associada)`);
    });
  }

  // 4. Resumo e recomendações
  header('📊 RESUMO E RECOMENDAÇÕES');

  const hasIssues = portsInUse.length > 0 || zombies.length > 0;

  if (!hasIssues) {
    log('✅ Sistema saudável! Todos os serviços podem ser iniciados.', 'green');
    return 0;
  }

  if (portsInUse.length > 0) {
    log('\n🔧 Portas em Uso - Ações Recomendadas:', 'yellow');
    console.log('\nOpções:');
    console.log('1. Matar processos manualmente:');

    portsInUse.forEach(p => {
      if (isWindows) {
        console.log(`   taskkill /F /PID ${p.pid}`);
      } else {
        console.log(`   kill -9 ${p.pid}`);
      }
    });

    console.log('\n2. Ou executar cleanup automático:');
    console.log('   npm run cleanup');
  }

  if (zombies.length > 0) {
    log('\n🧟 Processos Zombie - Ações Recomendadas:', 'yellow');
    console.log('\n1. Matar zombies:');

    zombies.forEach(z => {
      if (isWindows) {
        console.log(`   taskkill /F /PID ${z.pid}`);
      } else {
        console.log(`   kill -9 ${z.pid}`);
      }
    });

    console.log('\n2. Ou executar cleanup completo:');
    console.log('   npm run cleanup:all');
  }

  // 5. Modo interativo (opcional)
  header('💡 Modo Interativo');
  console.log('\nDeseja executar cleanup automático? (Ctrl+C para cancelar)');
  console.log('Execute: npm run cleanup');

  return hasIssues ? 1 : 0;
}

// Executar
runHealthCheck()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    log(`\n❌ Erro ao executar health check: ${error.message}`, 'red');
    process.exit(1);
  });
