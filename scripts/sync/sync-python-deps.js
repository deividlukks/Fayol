#!/usr/bin/env node

/**
 * Script para Sincronizar Dependências Python no Monorepo Fayol
 *
 * Uso:
 *   node scripts/sync-python-deps.js
 *   node scripts/sync-python-deps.js --dry-run
 *   node scripts/sync-python-deps.js --check
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
};

/**
 * Parse simples de YAML (apenas para estrutura específica)
 */
function parseYAML(content) {
  const lines = content.split(/[\r\n]+/);
  const result = {
    shared: {},
    'ai-service': {},
    'bi-reports': {},
    projects: {},
  };

  let currentSection = null;
  let currentProject = null;
  let inProjects = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Ignorar comentários e linhas vazias
    if (trimmed.startsWith('#') || trimmed === '') continue;

    // Detectar seção projects primeiro (tem prioridade)
    if (trimmed === 'projects:') {
      inProjects = true;
      currentSection = null;
      continue;
    }

    // Detectar seções principais (apenas se NÃO estiver em projects)
    if (!inProjects) {
      if (trimmed === 'shared:') {
        currentSection = 'shared';
        continue;
      }
      if (trimmed === 'ai-service:') {
        currentSection = 'ai-service';
        continue;
      }
      if (trimmed === 'bi-reports:') {
        currentSection = 'bi-reports';
        continue;
      }
    }

    // Parse de dependências
    if (currentSection && !inProjects) {
      const match = trimmed.match(/^([a-z0-9_-]+):\s*"?([^"]+)"?$/);
      if (match) {
        const [, pkg, version] = match;
        result[currentSection][pkg] = version;
      }
      continue;
    }

    // Parse de projetos
    if (inProjects) {
      // Ignorar keyword "dependencies:" (não é um nome de projeto)
      if (trimmed === 'dependencies:') {
        continue;
      }

      // Detectar novo projeto (mas não "dependencies:")
      const projectMatch = trimmed.match(/^([a-z0-9_-]+):$/);
      if (projectMatch) {
        currentProject = projectMatch[1];
        result.projects[currentProject] = { path: '', dependencies: [] };
        continue;
      }

      // Parse de path
      if (currentProject) {
        const pathMatch = trimmed.match(/^path:\s*"?([^"]+)"?$/);
        if (pathMatch) {
          result.projects[currentProject].path = pathMatch[1];
          continue;
        }

        const depMatch = trimmed.match(/^-\s+(.+)$/);
        if (depMatch) {
          result.projects[currentProject].dependencies.push(depMatch[1]);
        }
      }
    }
  }

  return result;
}

/**
 * Gera conteúdo do requirements.txt
 */
function generateRequirements(config, projectName) {
  const project = config.projects[projectName];
  if (!project) {
    throw new Error(`Projeto ${projectName} não encontrado no python-requirements.yaml`);
  }

  const packages = new Map();

  // Coletar todas as dependências
  for (const depGroup of project.dependencies) {
    const deps = config[depGroup];
    if (!deps) {
      console.warn(
        `${colors.yellow}⚠️  Grupo de dependências '${depGroup}' não encontrado${colors.reset}`
      );
      continue;
    }

    for (const [pkg, version] of Object.entries(deps)) {
      packages.set(pkg, version);
    }
  }

  // Ordenar alfabeticamente
  const sorted = Array.from(packages.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  // Gerar conteúdo
  const lines = [
    '# ============================================================',
    '# DEPENDÊNCIAS PYTHON - GERENCIADAS AUTOMATICAMENTE',
    '# ============================================================',
    '# Este arquivo é gerado automaticamente a partir de:',
    '# python-requirements.yaml',
    '#',
    '# NÃO EDITE MANUALMENTE!',
    '# Para atualizar, edite python-requirements.yaml e execute:',
    '#   node scripts/sync-python-deps.js',
    '# ============================================================',
    '',
  ];

  for (const [pkg, version] of sorted) {
    lines.push(`${pkg}==${version}`);
  }

  return lines.join('\n') + '\n';
}

/**
 * Verifica se requirements.txt está sincronizado
 */
function checkRequirements(config, projectName) {
  const project = config.projects[projectName];
  const filePath = path.join(__dirname, '..', project.path);

  if (!fs.existsSync(filePath)) {
    return { synced: false, reason: 'Arquivo não existe' };
  }

  const expected = generateRequirements(config, projectName);
  const actual = fs.readFileSync(filePath, 'utf8');

  // Remover comentários e linhas vazias do arquivo atual para comparação
  const actualLines = actual
    .split(/[\r\n]+/)
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .sort();

  const expectedLines = expected
    .split(/[\r\n]+/)
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .sort();

  const synced = JSON.stringify(actualLines) === JSON.stringify(expectedLines);

  return {
    synced,
    reason: synced ? 'Sincronizado' : 'Desatualizado',
    actual: actualLines,
    expected: expectedLines,
  };
}

// ===== MAIN =====
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
${colors.cyan}Sincronização de Dependências Python - Projeto Fayol${colors.reset}

${colors.yellow}Uso:${colors.reset}
  node scripts/sync-python-deps.js           Atualiza todos os requirements.txt
  node scripts/sync-python-deps.js --dry-run Mostra o que seria feito sem modificar
  node scripts/sync-python-deps.js --check   Verifica se está sincronizado

${colors.yellow}Exemplos:${colors.reset}
  node scripts/sync-python-deps.js
  node scripts/sync-python-deps.js --dry-run
`);
    process.exit(0);
  }

  const dryRun = args.includes('--dry-run');
  const checkOnly = args.includes('--check');

  console.log(`${colors.cyan}🐍 Sincronizando Dependências Python...${colors.reset}\n`);

  if (dryRun) {
    console.log(`${colors.yellow}[DRY RUN] Nenhum arquivo será modificado${colors.reset}\n`);
  }

  // Ler configuração
  const configPath = path.join(__dirname, '..', 'python-requirements.yaml');

  if (!fs.existsSync(configPath)) {
    console.error(`${colors.red}❌ Arquivo python-requirements.yaml não encontrado${colors.reset}`);
    process.exit(1);
  }

  const configContent = fs.readFileSync(configPath, 'utf8');
  const config = parseYAML(configContent);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  let outOfSyncCount = 0;

  // Processar cada projeto
  for (const [projectName, project] of Object.entries(config.projects)) {
    const filePath = path.join(__dirname, '..', project.path);

    try {
      // Verificar sincronização
      const check = checkRequirements(config, projectName);

      if (checkOnly) {
        if (check.synced) {
          console.log(`${colors.green}✅ ${projectName}: Sincronizado${colors.reset}`);
          successCount++;
        } else {
          console.log(`${colors.yellow}⚠️  ${projectName}: Desatualizado${colors.reset}`);
          outOfSyncCount++;
        }
        continue;
      }

      // Gerar novo conteúdo
      const newContent = generateRequirements(config, projectName);

      // Verificar se precisa atualizar
      if (fs.existsSync(filePath)) {
        const currentContent = fs.readFileSync(filePath, 'utf8');

        // Comparar apenas as linhas de dependências (ignorar comentários)
        const currentDeps = currentContent
          .split(/[\r\n]+/)
          .filter((line) => line.trim() && !line.trim().startsWith('#'))
          .sort()
          .join('\n');

        const newDeps = newContent
          .split(/[\r\n]+/)
          .filter((line) => line.trim() && !line.trim().startsWith('#'))
          .sort()
          .join('\n');

        if (currentDeps === newDeps) {
          console.log(`${colors.cyan}ℹ️  ${projectName}: Já está sincronizado${colors.reset}`);
          skipCount++;
          continue;
        }
      }

      // Atualizar arquivo
      if (!dryRun) {
        fs.writeFileSync(filePath, newContent, 'utf8');
      }

      console.log(`${colors.green}✅ ${projectName}: Atualizado${colors.reset}`);
      successCount++;
    } catch (error) {
      console.error(`${colors.red}❌ ${projectName}: Erro - ${error.message}${colors.reset}`);
      errorCount++;
    }
  }

  // Resumo
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);

  if (checkOnly) {
    console.log(`${colors.green}✅ Sincronizados: ${successCount}${colors.reset}`);
    if (outOfSyncCount > 0) {
      console.log(`${colors.yellow}⚠️  Desatualizados: ${outOfSyncCount}${colors.reset}`);
      console.log(
        `\n${colors.yellow}Execute 'node scripts/sync-python-deps.js' para sincronizar${colors.reset}`
      );
    }
  } else {
    console.log(`${colors.green}✅ Atualizados: ${successCount}${colors.reset}`);
    if (skipCount > 0) {
      console.log(`${colors.cyan}ℹ️  Pulados: ${skipCount}${colors.reset}`);
    }
  }

  if (errorCount > 0) {
    console.log(`${colors.red}❌ Erros: ${errorCount}${colors.reset}`);
  }

  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

  if (dryRun) {
    console.log(`${colors.yellow}[DRY RUN] Execução simulada concluída${colors.reset}`);
  } else if (!checkOnly) {
    console.log(`${colors.green}🎉 Sincronização concluída!${colors.reset}`);

    console.log(`\n${colors.yellow}Próximos passos:${colors.reset}`);
    console.log(`  1. Revisar mudanças: git diff`);
    console.log(`  2. Testar localmente: pip install -r libs/python-ai/requirements.txt`);
    console.log(`  3. Commitar: git add . && git commit -m "chore: sync Python dependencies"`);
  }
}

main();
