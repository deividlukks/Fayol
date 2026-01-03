const fs = require('fs-extra');
const path = require('path');

const assetsSourceDir = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'packages',
  'assets',
  'src',
  'images'
);
const assetsTargetDir = path.join(__dirname, '..', 'public', 'assets');

async function copyAssets() {
  try {
    // Garante que a pasta public/assets existe
    await fs.ensureDir(assetsTargetDir);

    // Copia todas as imagens do package @fayol/assets para public/assets
    await fs.copy(assetsSourceDir, assetsTargetDir, {
      overwrite: true,
    });

    console.log('✓ Assets do @fayol/assets copiados para public/assets com sucesso!');
  } catch (error) {
    console.error('✗ Erro ao copiar assets:', error);
    process.exit(1);
  }
}

copyAssets();
