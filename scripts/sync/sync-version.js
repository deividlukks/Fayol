#!/usr/bin/env node

/**
 * Script para Sincronizar Versões no Monorepo Fayol
 *
 * Uso:
 *   node scripts/sync-version.js 0.5.0
 *   node scripts/sync-version.js --patch
 *   node scripts/sync-version.js --minor
 *   node scripts/sync-version.js --major
 *   node scripts/sync-version.js 0.5.0 --tag
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

/**
 * Valida formato semver (semantic versioning)
 */
function isValidSemver(version) {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(-[a-z0-9.-]+)?(\+[a-z0-9.-]+)?$/i;
  return semverRegex.test(version);
}

/**
 * Extrai números de versão semver
 */
function parseSemver(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3]),
  };
}

/**
 * Incrementa versão baseado no tipo de bump
 */
function bumpVersion(currentVersion, bumpType) {
  const parts = parseSemver(currentVersion);
  if (!parts) {
    console.error(`${colors.red}❌ Versão atual inválida: ${currentVersion}${colors.reset}`);
    process.exit(1);
  }

  switch (bumpType) {
    case 'major':
      return `${parts.major + 1}.0.0`;
    case 'minor':
      return `${parts.major}.${parts.minor + 1}.0`;
    case 'patch':
      return `${parts.major}.${parts.minor}.${parts.patch + 1}`;
    default:
      throw new Error(`Tipo de bump inválido: ${bumpType}`);
  }
}

/**
 * Lê workspaces do pnpm-workspace.yaml
 */
function getWorkspaces() {
  try {
    const workspaceFile = path.join(__dirname, '..', 'pnpm-workspace.yaml');
    const content = fs.readFileSync(workspaceFile, 'utf8');

    // Parse simples do YAML (assume formato padrão)
    // Suporta line endings Windows (\r\n) e Unix (\n)
    const packagesMatch = content.match(/packages:\s*[\r\n]+((?:\s+-\s+.+[\r\n]+)*)/);
    if (!packagesMatch) {
      throw new Error('Não foi possível parsear pnpm-workspace.yaml');
    }

    const patterns = packagesMatch[1]
      .split(/[\r\n]+/)
      .filter((line) => line.trim().startsWith('-'))
      .map((line) => line.trim().substring(2).trim().replace(/['"]/g, ''));

    // Expandir patterns (apps/*, packages/*)
    const workspaces = ['.']; // Raiz sempre incluída

    patterns.forEach((pattern) => {
      if (pattern.endsWith('/*')) {
        const baseDir = pattern.slice(0, -2);
        const fullPath = path.join(__dirname, '..', baseDir);

        if (fs.existsSync(fullPath)) {
          const dirs = fs
            .readdirSync(fullPath, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => path.join(baseDir, dirent.name));
          workspaces.push(...dirs);
        }
      } else {
        workspaces.push(pattern);
      }
    });

    return workspaces;
  } catch (error) {
    console.error(
      `${colors.yellow}⚠️  Não foi possível ler workspaces automaticamente${colors.reset}`
    );
    console.error(`${colors.yellow}   Usando lista manual de fallback${colors.reset}`);

    // Fallback para lista hardcoded
    return [
      '.',
      'apps/admin-panel',
      'apps/backend',
      'apps/web-app',
      'apps/telegram-bot',
      'apps/mobile',
      'apps/whatsapp-bot',
      'packages/ai-services',
      'packages/api-client',
      'packages/api-client-core',
      'packages/api-client-mobile',
      'packages/assets',
      'packages/database-models',
      'packages/integrations',
      'packages/shared-constants',
      'packages/shared-errors',
      'packages/shared-types',
      'packages/shared-utils',
      'packages/ui-components',
      'packages/validation-schemas',
      'packages/web-shared',
      'packages/web-ui-components',
    ];
  }
}

/**
 * Atualiza versões em arquivos Python (FastAPI)
 */
function updatePythonFiles(newVersion, dryRun = false) {
  const pythonFiles = [
    {
      path: 'libs/python-ai/src/main.py',
      name: 'Python AI Service',
      pattern: /(version\s*=\s*")[^"]+(")/,
      lineHint: 'linha 13',
    },
    {
      path: 'libs/bi-reports/src/main.py',
      name: 'BI Reports Service',
      pattern: /(version\s*=\s*")[^"]+(")/,
      lineHint: 'linha 11',
    },
  ];

  console.log(`\n${colors.cyan}📝 Atualizando arquivos Python (FastAPI)...${colors.reset}\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  pythonFiles.forEach(({ path: filePath, name, pattern, lineHint }) => {
    const fullPath = path.join(__dirname, '..', filePath);

    if (!fs.existsSync(fullPath)) {
      console.log(
        `${colors.yellow}⚠️  ${name}: arquivo não encontrado (${filePath})${colors.reset}`
      );
      skipCount++;
      return;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');

      // Verificar se o padrão existe no arquivo
      const match = content.match(pattern);
      if (!match) {
        console.log(`${colors.yellow}⚠️  ${name}: padrão de versão não encontrado${colors.reset}`);
        skipCount++;
        return;
      }

      // Extrair versão atual
      const currentVersionMatch = content.match(/version\s*=\s*"([^"]+)"/);
      const oldVersion = currentVersionMatch ? currentVersionMatch[1] : 'desconhecida';

      // Verificar se já está na versão correta
      if (oldVersion === newVersion) {
        console.log(`${colors.cyan}ℹ️  ${name}: já está em ${newVersion}${colors.reset}`);
        skipCount++;
        return;
      }

      // Substituir versão
      const newContent = content.replace(pattern, `$1${newVersion}$2`);

      if (!dryRun) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
      }

      console.log(
        `${colors.green}✅ ${name} (${lineHint}): ${oldVersion} -> ${newVersion}${colors.reset}`
      );
      successCount++;
    } catch (error) {
      console.error(`${colors.red}❌ ${name}: Erro - ${error.message}${colors.reset}`);
      errorCount++;
    }
  });

  return { successCount, skipCount, errorCount };
}

/**
 * Cria git tag
 */
function createGitTag(version, dryRun = false) {
  const tag = `v${version}`;
  try {
    // Verificar se tag já existe
    try {
      execSync(`git rev-parse ${tag}`, { stdio: 'pipe' });
      console.log(`${colors.yellow}⚠️  Tag ${tag} já existe${colors.reset}`);
      return;
    } catch {
      // Tag não existe, pode criar
    }

    if (dryRun) {
      console.log(`${colors.cyan}🏷️  [DRY RUN] Criaria tag: ${tag}${colors.reset}`);
    } else {
      execSync(`git tag -a ${tag} -m "Release ${tag}"`, { stdio: 'inherit' });
      console.log(`${colors.green}✅ Git tag criada: ${tag}${colors.reset}`);
      console.log(`${colors.cyan}   Para enviar: git push origin ${tag}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Erro ao criar tag: ${error.message}${colors.reset}`);
  }
}

// ===== MAIN =====
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
${colors.cyan}Sincronização de Versões - Projeto Fayol${colors.reset}

${colors.yellow}Uso:${colors.reset}
  node scripts/sync-version.js <version>       Define versão específica
  node scripts/sync-version.js --patch         Incrementa patch (0.1.0 -> 0.1.1)
  node scripts/sync-version.js --minor         Incrementa minor (0.1.0 -> 0.2.0)
  node scripts/sync-version.js --major         Incrementa major (0.1.0 -> 1.0.0)

${colors.yellow}Opções:${colors.reset}
  --tag         Cria git tag após atualizar versões
  --dry-run     Mostra o que seria feito sem modificar arquivos

${colors.yellow}Exemplos:${colors.reset}
  node scripts/sync-version.js 1.0.0
  node scripts/sync-version.js --patch --tag
  node scripts/sync-version.js 2.0.0-beta.1 --dry-run
`);
    process.exit(0);
  }

  const createTag = args.includes('--tag');
  const dryRun = args.includes('--dry-run');

  let newVersion;
  let bumpType = null;

  // Determinar versão
  if (args.includes('--patch')) {
    bumpType = 'patch';
  } else if (args.includes('--minor')) {
    bumpType = 'minor';
  } else if (args.includes('--major')) {
    bumpType = 'major';
  } else {
    newVersion = args.find((arg) => !arg.startsWith('--'));
  }

  // Se é bump automático, ler versão atual da raiz
  if (bumpType) {
    const rootPkgPath = path.join(__dirname, '..', 'package.json');
    const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
    const currentVersion = rootPkg.version;
    newVersion = bumpVersion(currentVersion, bumpType);
    console.log(
      `${colors.cyan}🔄 Bump ${bumpType}: ${currentVersion} -> ${newVersion}${colors.reset}`
    );
  }

  // Validar versão
  if (!newVersion) {
    console.error(`${colors.red}❌ Por favor, forneça uma versão ou tipo de bump${colors.reset}`);
    console.error(`${colors.yellow}   Exemplo: node scripts/sync-version.js 0.5.0${colors.reset}`);
    console.error(
      `${colors.yellow}   ou:      node scripts/sync-version.js --patch${colors.reset}`
    );
    process.exit(1);
  }

  if (!isValidSemver(newVersion)) {
    console.error(`${colors.red}❌ Versão inválida: ${newVersion}${colors.reset}`);
    console.error(
      `${colors.yellow}   Use formato semver: MAJOR.MINOR.PATCH (ex: 1.0.0, 2.3.4-beta.1)${colors.reset}`
    );
    process.exit(1);
  }

  console.log(
    `${colors.cyan}🔄 Atualizando projeto para a versão: ${newVersion}...${colors.reset}\n`
  );

  if (dryRun) {
    console.log(`${colors.yellow}[DRY RUN] Nenhum arquivo será modificado${colors.reset}\n`);
  }

  const workspaces = getWorkspaces();
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  workspaces.forEach((workspace) => {
    const pkgPath = path.join(__dirname, '..', workspace, 'package.json');

    if (!fs.existsSync(pkgPath)) {
      console.log(`${colors.yellow}⚠️  ${workspace}: package.json não encontrado${colors.reset}`);
      skipCount++;
      return;
    }

    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const oldVersion = pkg.version;

      if (oldVersion === newVersion) {
        console.log(`${colors.cyan}ℹ️  ${workspace}: já está em ${newVersion}${colors.reset}`);
        skipCount++;
        return;
      }

      pkg.version = newVersion;

      if (!dryRun) {
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      }

      console.log(`${colors.green}✅ ${workspace}: ${oldVersion} -> ${newVersion}${colors.reset}`);
      successCount++;
    } catch (error) {
      console.error(`${colors.red}❌ ${workspace}: Erro - ${error.message}${colors.reset}`);
      errorCount++;
    }
  });

  // Atualizar arquivos Python (FastAPI)
  const pythonStats = updatePythonFiles(newVersion, dryRun);

  // Resumo consolidado
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}📦 package.json:${colors.reset}`);
  console.log(`   ${colors.green}✅ Atualizados: ${successCount}${colors.reset}`);
  if (skipCount > 0) {
    console.log(`   ${colors.cyan}ℹ️  Pulados: ${skipCount}${colors.reset}`);
  }
  if (errorCount > 0) {
    console.log(`   ${colors.red}❌ Erros: ${errorCount}${colors.reset}`);
  }

  console.log(`\n${colors.cyan}🐍 Arquivos Python:${colors.reset}`);
  console.log(`   ${colors.green}✅ Atualizados: ${pythonStats.successCount}${colors.reset}`);
  if (pythonStats.skipCount > 0) {
    console.log(`   ${colors.cyan}ℹ️  Pulados: ${pythonStats.skipCount}${colors.reset}`);
  }
  if (pythonStats.errorCount > 0) {
    console.log(`   ${colors.red}❌ Erros: ${pythonStats.errorCount}${colors.reset}`);
  }

  const totalUpdated = successCount + pythonStats.successCount;
  console.log(`\n${colors.cyan}📊 Total: ${totalUpdated} arquivos atualizados${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

  if (dryRun) {
    console.log(`${colors.yellow}[DRY RUN] Execução simulada concluída${colors.reset}`);
  } else {
    console.log(`${colors.green}🎉 Sincronização concluída!${colors.reset}`);

    if (createTag) {
      createGitTag(newVersion, dryRun);
    }

    console.log(`\n${colors.yellow}Próximos passos:${colors.reset}`);
    console.log(`  1. git add .`);
    console.log(`  2. git commit -m "chore: bump version to ${newVersion}"`);
    if (createTag) {
      console.log(`  3. git push origin main --tags`);
    } else {
      console.log(`  3. git push origin main`);
    }
  }
}

main();
