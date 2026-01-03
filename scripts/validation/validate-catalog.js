#!/usr/bin/env node

/**
 * Script de validação para CI/CD
 * Verifica se todas as dependências estão usando catalog:
 * Falha se encontrar dependências hardcoded
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const rootDir = path.resolve(__dirname, '..');

function readWorkspaceYaml() {
  const workspacePath = path.join(rootDir, 'pnpm-workspace.yaml');
  const content = fs.readFileSync(workspacePath, 'utf8');
  return yaml.load(content);
}

function findPackageJsonFiles() {
  const workspace = readWorkspaceYaml();
  const packages = [path.join(rootDir, 'package.json')];

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

function isHardcodedVersion(version) {
  return (
    version &&
    version !== 'catalog:' &&
    !version.startsWith('workspace:') &&
    !version.startsWith('npm:') &&
    !version.startsWith('link:')
  );
}

function validatePackageJson(pkgPath, catalog) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const issues = [];

  ['dependencies', 'devDependencies', 'peerDependencies'].forEach((depType) => {
    if (pkg[depType]) {
      Object.entries(pkg[depType]).forEach(([name, version]) => {
        if (isHardcodedVersion(version)) {
          const inCatalog = catalog.hasOwnProperty(name);
          issues.push({
            package: path.relative(rootDir, pkgPath),
            depType,
            name,
            version,
            inCatalog,
          });
        }
      });
    }
  });

  return issues;
}

// Main
const workspace = readWorkspaceYaml();
const catalog = workspace.catalog || {};
const packageFiles = findPackageJsonFiles();

let allIssues = [];
packageFiles.forEach((pkgPath) => {
  const issues = validatePackageJson(pkgPath, catalog);
  allIssues = allIssues.concat(issues);
});

if (allIssues.length > 0) {
  console.error('\n❌ Encontradas dependências com versões hardcoded:\n');

  allIssues.forEach((issue) => {
    console.error(`  ${issue.package}`);
    console.error(`    ${issue.name}: ${issue.version}`);
    if (issue.inCatalog) {
      console.error(`    ⚠ Esta dependência existe no catalog!`);
    } else {
      console.error(`    ℹ Esta dependência não está no catalog`);
    }
    console.error();
  });

  console.error('Execute: pnpm run sync-catalog --fix');
  console.error('Ou: pnpm run sync-catalog --add\n');
  process.exit(1);
}

console.log('✓ Todas as dependências estão usando catalog:');
process.exit(0);
