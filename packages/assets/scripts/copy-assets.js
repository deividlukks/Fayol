const fs = require('fs-extra');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'images');
const distDir = path.join(__dirname, '..', 'dist', 'images');

async function copyAssets() {
  try {
    // Remove dist/images se existir
    await fs.remove(distDir);

    // Copia todas as imagens de src/images para dist/images
    await fs.copy(srcDir, distDir);

    console.log('✓ Assets copiados com sucesso!');
  } catch (error) {
    console.error('✗ Erro ao copiar assets:', error);
    process.exit(1);
  }
}

copyAssets();
