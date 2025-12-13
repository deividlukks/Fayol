/**
 * Script para Sincronizar Versões no Monorepo Fayol
 * Uso: node scripts/sync-version.js 0.4.1
 */
const fs = require('fs');
const path = require('path');

// 1. Pegar a versão do argumento
const newVersion = process.argv[2];

if (!newVersion) {
  console.error('❌ Por favor, forneça uma versão. Ex: node scripts/sync-version.js 0.4.1');
  process.exit(1);
}

// 2. Lista de caminhos onde existem package.json
const workspaces = [
  '.', // Raiz
  'apps/backend',
  'apps/web-app',
  'apps/telegram-bot',
  'packages/api-client',
  'packages/database-models',
  'packages/integrations',
  'packages/shared-constants',
  'packages/shared-types',
  'packages/shared-utils',
  'packages/ui-components',
  'packages/validation-schemas',
  'libs/python-ai', // Nota: Python usa setup.py ou pyproject.toml geralmente, mas se tiver package.json mantemos
  'packages/ai-services'
];

console.log(`🔄 Atualizando projeto para a versão: ${newVersion}...`);

workspaces.forEach((workspace) => {
  const pkgPath = path.join(__dirname, '..', workspace, 'package.json');
  
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const oldVersion = pkg.version;
      pkg.version = newVersion;
      
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log(`✅ ${workspace}: ${oldVersion} -> ${newVersion}`);
    } catch (e) {
      console.error(`⚠️ Erro ao atualizar ${workspace}: ${e.message}`);
    }
  } else {
    console.warn(`⚠️ Arquivo não encontrado: ${pkgPath}`);
  }
});

console.log('🎉 Sincronização concluída!');