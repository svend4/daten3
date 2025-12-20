// Startup wrapper with better error handling
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting TravelHub Backend...');
console.log('📁 Current directory:', process.cwd());
console.log('📦 Node version:', process.version);
console.log('🔧 Platform:', process.platform);

const indexPath = join(__dirname, 'dist', 'index.js');
console.log('🔍 Looking for:', indexPath);
console.log('✅ File exists:', existsSync(indexPath));

if (!existsSync(indexPath)) {
  console.error('❌ ERROR: dist/index.js not found!');
  console.error('   Build may have failed.');
  console.error('   Check build logs above.');
  process.exit(1);
}

try {
  console.log('📥 Loading backend...');
  await import('./dist/index.js');
  console.log('✅ Backend loaded successfully');
} catch (error) {
  console.error('❌ ERROR loading backend:');
  console.error(error);
  process.exit(1);
}
