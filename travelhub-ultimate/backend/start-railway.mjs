#!/usr/bin/env node
// Build DATABASE_URL from Railway service variables dynamically
// This workaround is needed because Railway UI doesn't save long DATABASE_URL values

import { execSync } from 'child_process';

console.log('=== TravelHub Backend Startup ===\n');
console.log('🔧 Building DATABASE_URL from Railway service variables...\n');

// Try to get DATABASE_URL from Postgres service via Railway's service variable injection
// Railway injects service variables with format: POSTGRES_<VARIABLE_NAME>
const buildDatabaseUrl = () => {
  // Check if we have Postgres service variables
  const pgHost = process.env.RAILWAY_TCP_PROXY_DOMAIN || process.env.PGHOST;
  const pgPort = process.env.RAILWAY_TCP_PROXY_PORT || process.env.PGPORT || '5432';
  const pgUser = process.env.PGUSER || 'postgres';
  const pgPassword = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD;
  const pgDatabase = process.env.PGDATABASE || 'railway';

  if (!pgHost || !pgPassword) {
    console.log('⚠️  Missing PostgreSQL connection details from Railway\n');
    console.log('Available env vars:');
    console.log(`  RAILWAY_TCP_PROXY_DOMAIN: ${pgHost ? '✓ set' : '✗ missing'}`);
    console.log(`  RAILWAY_TCP_PROXY_PORT: ${process.env.RAILWAY_TCP_PROXY_PORT ? '✓ set' : '✗ missing'}`);
    console.log(`  POSTGRES_PASSWORD: ${pgPassword ? '✓ set' : '✗ missing'}`);
    console.log(`  PGUSER: ${process.env.PGUSER ? '✓ set' : '✗ missing'}`);
    console.log(`  PGDATABASE: ${process.env.PGDATABASE ? '✓ set' : '✗ missing'}\n`);
    return null;
  }

  const url = `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}`;
  console.log(`✅ Built DATABASE_URL from service variables`);
  console.log(`   Host: ${pgHost}`);
  console.log(`   Port: ${pgPort}`);
  console.log(`   Database: ${pgDatabase}`);
  console.log(`   User: ${pgUser}\n`);

  return url;
};

// Check if DATABASE_URL is already set and valid
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl.length < 20) {
  console.log('⚠️  DATABASE_URL not set or invalid (length: ' + (databaseUrl?.length || 0) + ')\n');
  console.log('Attempting to build from Railway service variables...\n');

  databaseUrl = buildDatabaseUrl();

  if (databaseUrl) {
    // Set it for Prisma
    process.env.DATABASE_URL = databaseUrl;
    console.log('✅ DATABASE_URL set successfully\n');
  } else {
    console.error('❌ Could not build DATABASE_URL!\n');
    console.error('To fix this, you need to add Postgres service variables to backend:\n');
    console.error('Option 1: Link Postgres service variables in Railway Dashboard:');
    console.error('  1. Railway → daten3 backend → Settings → Service Variables');
    console.error('  2. Add references to Postgres service variables\n');
    console.error('Option 2: Use Railway CLI to set DATABASE_URL:');
    console.error('  railway variables set DATABASE_URL=\'postgresql://...\'\n');

    console.log('⚠️  Starting server WITHOUT database...\n');
    await import('./dist/index.js');
    process.exit(0);
  }
}

console.log(`DATABASE_URL preview: ${databaseUrl.substring(0, 60)}...`);
console.log(`DATABASE_URL length: ${databaseUrl.length} characters\n`);

// Parse and validate
try {
  const url = new URL(databaseUrl);
  console.log('Database Configuration:');
  console.log(`  Host: ${url.hostname}`);
  console.log(`  Port: ${url.port || '5432'}`);
  console.log(`  Database: ${url.pathname.slice(1)}`);
  console.log(`  User: ${url.username}\n`);

  console.log('Attempting database migrations...\n');

  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      timeout: 30000,
      env: { ...process.env, DATABASE_URL: databaseUrl }
    });

    console.log('\n✅ Migrations applied successfully!\n');

  } catch (migrationError) {
    console.error('\n❌ Migration failed!\n');
    console.error('Error:', migrationError.message);
    console.error('\nPossible reasons:');
    console.error('  1. PostgreSQL service not running');
    console.error('  2. Wrong connection details');
    console.error('  3. Connection timeout');
    console.error('  4. Database permissions issue\n');

    console.log('⚠️  Starting server WITHOUT migrations...');
    console.log('   Server will run but database operations will fail!\n');
  }

} catch (parseError) {
  console.error('❌ Invalid DATABASE_URL format!\n');
  console.error('Error:', parseError.message);
  console.error('Expected: postgresql://USER:PASSWORD@HOST:PORT/DATABASE\n');
  console.log('⚠️  Starting server without database...\n');
}

// Start the server
console.log('Starting Express server...\n');
await import('./dist/index.js');
