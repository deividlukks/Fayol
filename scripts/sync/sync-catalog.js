#!/usr/bin/env node

/**
 * Script para sincronizar dependências com o catalog do pnpm
 *
 * Funcionalidades:
 * 1. Encontra todas as dependências hardcoded nos package.json do workspace
 * 2. Verifica se existem no catalog do pnpm-workspace.yaml
 * 3. Converte para "catalog:" se existirem
 * 4. Opcionalmente adiciona ao catalog se não existirem
 *
 * Uso:
 * - pnpm run sync-catalog           # Apenas reporta diferenças
 * - pnpm run sync-catalog --fix     # Converte para catalog:
 * - pnpm run sync-catalog --add     # Adiciona ao catalog e converte
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Parse argumentos da linha de comando
const args = process.argv.slice(2);
const options = {
  fix: args.includes('--fix'),
  add: args.includes('--add'),
  verbose: args.includes('--verbose') || args.includes('-v'),
};

// Encontra o diretório raiz do projeto
const rootDir = path.resolve(__dirname, '..');

/**
 * Lê e parseia o pnpm-workspace.yaml
 */
function readWorkspaceYaml() {
  const workspacePath = path.join(rootDir, 'pnpm-workspace.yaml');
  const content = fs.readFileSync(workspacePath, 'utf8');
  return yaml.load(content);
}

/**
 * Escreve o pnpm-workspace.yaml atualizado
 */
function writeWorkspaceYaml(data) {
  const workspacePath = path.join(rootDir, 'pnpm-workspace.yaml');
  const content = yaml.dump(data, {
    lineWidth: -1, // Não quebra linhas
    quotingType: "'",
    forceQuotes: false,
  });
  fs.writeFileSync(workspacePath, content, 'utf8');
}

/**
 * Encontra todos os package.json no workspace
 */
function findPackageJsonFiles() {
  const workspace = readWorkspaceYaml();
  const packages = [];

  // Adiciona o package.json raiz
  packages.push(path.join(rootDir, 'package.json'));

  // Processa cada padrão do workspace
  workspace.packages.forEach((pattern) => {
    const baseDir = pattern.replace('/*', '');
    const fullPath = path.join(rootDir, baseDir);

    if (fs.existsSync(fullPath)) {
      const entries = fs.readdirSync(fullPath, { withFileTypes: true });
      entries.forEach((entry) => {
        if (entry.isDirectory()) {
          const pkgPath = path.join(fullPath, entry.name, 'package.json');
          if (fs.existsSync(pkgPath)) {
            packages.push(pkgPath);
          }
        }
      });
    }
  });

  return packages;
}

/**
 * Verifica se uma dependência está usando versão hardcoded
 */
function isHardcodedVersion(version) {
  return (
    version &&
    version !== 'catalog:' &&
    !version.startsWith('workspace:') &&
    !version.startsWith('npm:') &&
    !version.startsWith('link:')
  );
}

/**
 * Analisa um package.json em busca de dependências hardcoded
 */
function analyzePackageJson(pkgPath, catalog) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const issues = [];

  const depTypes = ['dependencies', 'devDependencies', 'peerDependencies'];

  depTypes.forEach((depType) => {
    if (pkg[depType]) {
      Object.entries(pkg[depType]).forEach(([name, version]) => {
        if (isHardcodedVersion(version)) {
          const inCatalog = catalog.hasOwnProperty(name);
          const catalogVersion = catalog[name];

          issues.push({
            package: path.relative(rootDir, pkgPath),
            depType,
            name,
            currentVersion: version,
            inCatalog,
            catalogVersion,
          });
        }
      });
    }
  });

  return { pkg, issues };
}

/**
 * Converte dependências para catalog:
 */
function convertToCatalog(pkgPath, issues) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  let modified = false;

  issues.forEach((issue) => {
    if (issue.inCatalog && pkg[issue.depType] && pkg[issue.depType][issue.name]) {
      pkg[issue.depType][issue.name] = 'catalog:';
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }

  return modified;
}

/**
 * Adiciona dependências ao catalog
 */
function addToCatalog(workspace, issues) {
  if (!workspace.catalog) {
    workspace.catalog = {};
  }

  let added = 0;
  issues.forEach((issue) => {
    if (!issue.inCatalog) {
      workspace.catalog[issue.name] = issue.currentVersion;
      added++;
    }
  });

  return added;
}

/**
 * Formata a saída de uma issue
 */
function formatIssue(issue, index) {
  const status = issue.inCatalog
    ? `${colors.green}✓ No catalog${colors.reset}`
    : `${colors.red}✗ Não está no catalog${colors.reset}`;

  console.log(`\n${index + 1}. ${colors.cyan}${issue.name}${colors.reset}`);
  console.log(`   Arquivo: ${issue.package}`);
  console.log(`   Tipo: ${issue.depType}`);
  console.log(`   Versão atual: ${colors.yellow}${issue.currentVersion}${colors.reset}`);
  console.log(`   Status: ${status}`);

  if (issue.inCatalog && issue.catalogVersion !== issue.currentVersion) {
    console.log(
      `   ${colors.yellow}⚠ Versão diferente no catalog: ${issue.catalogVersion}${colors.reset}`
    );
  }
}

/**
 * Main
 */
function main() {
  console.log(`${colors.blue}=== Sincronizador de Catalog do PNPM ===${colors.reset}\n`);

  const workspace = readWorkspaceYaml();
  const catalog = workspace.catalog || {};
  const packageFiles = findPackageJsonFiles();

  console.log(`Encontrados ${packageFiles.length} package.json files\n`);

  let allIssues = [];
  const issuesByPackage = new Map();

  // Analisa todos os package.json
  packageFiles.forEach((pkgPath) => {
    const { issues } = analyzePackageJson(pkgPath, catalog);
    if (issues.length > 0) {
      allIssues = allIssues.concat(issues);
      issuesByPackage.set(pkgPath, issues);
    }
  });

  if (allIssues.length === 0) {
    console.log(`${colors.green}✓ Todas as dependências já estão usando catalog:${colors.reset}`);
    return;
  }

  // Estatísticas
  const inCatalog = allIssues.filter((i) => i.inCatalog).length;
  const notInCatalog = allIssues.length - inCatalog;

  console.log(
    `${colors.yellow}Encontradas ${allIssues.length} dependências hardcoded:${colors.reset}`
  );
  console.log(`  - ${colors.green}${inCatalog} já estão no catalog${colors.reset}`);
  console.log(`  - ${colors.red}${notInCatalog} não estão no catalog${colors.reset}\n`);

  // Mostra detalhes se verbose
  if (options.verbose) {
    console.log(`${colors.blue}Detalhes:${colors.reset}`);
    allIssues.forEach((issue, i) => formatIssue(issue, i));
    console.log();
  }

  // Executa ações baseadas nas opções
  if (options.add) {
    console.log(`${colors.blue}Adicionando dependências ao catalog...${colors.reset}`);
    const added = addToCatalog(
      workspace,
      allIssues.filter((i) => !i.inCatalog)
    );
    if (added > 0) {
      writeWorkspaceYaml(workspace);
      console.log(`${colors.green}✓ ${added} dependências adicionadas ao catalog${colors.reset}\n`);
      // Recarrega o catalog atualizado
      workspace.catalog = readWorkspaceYaml().catalog;
    }
  }

  if (options.fix || options.add) {
    console.log(`${colors.blue}Convertendo dependências para catalog:...${colors.reset}`);
    let modified = 0;

    issuesByPackage.forEach((issues, pkgPath) => {
      const issuesInCatalog = issues.filter(
        (i) => workspace.catalog && workspace.catalog.hasOwnProperty(i.name)
      );

      if (issuesInCatalog.length > 0) {
        if (convertToCatalog(pkgPath, issuesInCatalog)) {
          modified++;
          console.log(`  ${colors.green}✓${colors.reset} ${path.relative(rootDir, pkgPath)}`);
        }
      }
    });

    console.log(`\n${colors.green}✓ ${modified} package.json files modificados${colors.reset}`);
  } else {
    console.log(`${colors.yellow}Dica: Use --fix para converter automaticamente${colors.reset}`);
    console.log(
      `${colors.yellow}Dica: Use --add para adicionar ao catalog e converter${colors.reset}`
    );
    console.log(`${colors.yellow}Dica: Use --verbose para ver detalhes${colors.reset}`);
  }
}

// Executa
try {
  main();
} catch (error) {
  console.error(`${colors.red}Erro: ${error.message}${colors.reset}`);
  if (options.verbose) {
    console.error(error.stack);
  }
  process.exit(1);
}
