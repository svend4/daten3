// Simple .env loader for development
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '.env');

try {
  const env = readFileSync(envPath, 'utf8');
  env.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const [key, ...values] = line.split('=');
    if (key && values.length) {
      const value = values.join('=').replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value.trim();
    }
  });
  console.log('✓ .env loaded successfully');
} catch (err) {
  console.warn('⚠ .env file not found, using existing environment variables');
}
