const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const wrapperPath = path.join(distPath, 'main.js');
const wrapperContent = `// Wrapper to load the actual main file from the monorepo structure
require('./apps/backend/src/main');
`;

// Ensure dist directory exists
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Create wrapper file
fs.writeFileSync(wrapperPath, wrapperContent, 'utf8');
console.log('✅ Created dist/main.js wrapper');
