#!/usr/bin/env node
// Startup script for Render deployment
// Simpler than Railway version - just checks DATABASE_URL

import { execSync } from 'child_process';

console.log('=== TravelHub Backend Startup (Render) ===\n');

// Check DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is NOT SET!\n');
  console.error('Fix this in Render Dashboard:');
  console.error('  1. Open your Web Service');
  console.error('  2. Click "Environment" in left menu');
  console.error('  3. Add Environment Variable:');
  console.error('     Key: DATABASE_URL');
  console.error('     Value: <Internal Database URL from PostgreSQL service>\n');
  console.error('⚠️  Server will start but all API endpoints will fail!\n');

  // Start anyway for debugging
  console.error('⚠️  Starting server WITHOUT database migrations!\n');
  await import('./dist/index.js');
  // Don't exit - let the server run
  return;
}

console.log('✅ DATABASE_URL is set\n');
console.log(`DATABASE_URL preview: ${databaseUrl.substring(0, 60)}...`);
console.log(`DATABASE_URL length: ${databaseUrl.length} characters\n`);

// Parse and validate URL
try {
  const url = new URL(databaseUrl);
  console.log('Database Configuration:');
  console.log(`  Host: ${url.hostname}`);
  console.log(`  Port: ${url.port || '5432'}`);
  console.log(`  Database: ${url.pathname.slice(1)}`);
  console.log(`  User: ${url.username}\n`);

  console.log('Running database migrations...\n');

  try {
    console.log('⏳ This may take up to 2 minutes on first deploy...\n');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      timeout: 120000, // 2 minutes for slow Render deployments
    });

    console.log('\n✅ Migrations applied successfully!\n');

  } catch (migrationError) {
    console.error('\n❌ Migration failed!\n');
    console.error('Error:', migrationError.message);
    console.error('\nTrying to continue anyway...\n');

    // Try to generate Prisma client at least
    try {
      console.log('Generating Prisma Client...\n');
      execSync('npx prisma generate', {
        stdio: 'inherit',
        timeout: 60000,
      });
      console.log('✅ Prisma Client generated\n');
    } catch (generateError) {
      console.error('❌ Prisma generate failed:', generateError.message);
    }
  }

} catch (parseError) {
  console.error('❌ Invalid DATABASE_URL format!\n');
  console.error('Expected format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE\n');
}

// Start the server
console.log('🚀 Starting Express server...\n');
console.log('════════════════════════════════════════\n');

// Import and let it run - don't exit this process
await import('./dist/index.js');

// Keep the process alive - the Express server will handle shutdown signals
console.log('✅ Server started successfully!\n');
console.log('Process will remain alive until shutdown signal...\n');
