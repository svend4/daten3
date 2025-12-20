#!/usr/bin/env node
// Safe startup script - starts server even if migrations fail

import { execSync } from 'child_process';

console.log('=== TravelHub Backend Startup ===\n');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!');
  console.error('   Backend will start but database features will not work.\n');
  console.error('   To fix:');
  console.error('   1. Go to Railway Dashboard');
  console.error('   2. Create PostgreSQL service (if not exists)');
  console.error('   3. Copy DATABASE_URL from Postgres → Variables');
  console.error('   4. Add to daten3-travelbackend → Variables → DATABASE_URL\n');

  console.log('⚠️  Starting server WITHOUT database...\n');
  await import('./dist/index.js');
  process.exit(0);
}

console.log('✅ DATABASE_URL is set\n');

// Parse DATABASE_URL to show configuration
try {
  const url = new URL(process.env.DATABASE_URL);
  console.log('Database Configuration:');
  console.log(`  Host: ${url.hostname}`);
  console.log(`  Port: ${url.port || '5432'}`);
  console.log(`  Database: ${url.pathname.slice(1)}`);
  console.log(`  User: ${url.username}\n`);

  // Check for known bad hostnames
  if (url.hostname === 'daten3.railway.internal') {
    console.error('❌ INVALID DATABASE HOSTNAME: daten3.railway.internal\n');
    console.error('This hostname doesn\'t exist! You need to:');
    console.error('1. Open Railway → Postgres service → Variables');
    console.error('2. Copy DATABASE_URL');
    console.error('3. Paste into backend Variables\n');
    console.error('Expected hostname:');
    console.error('  - containers-us-west-XXX.railway.app');
    console.error('  - OR postgres.railway.internal\n');

    console.log('⚠️  Starting server without migrations...\n');
    await import('./dist/index.js');
    process.exit(0);
  }

  console.log('Attempting database migrations...\n');

  // Try to run migrations with timeout
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      timeout: 30000, // 30 seconds timeout
    });

    console.log('\n✅ Migrations applied successfully!\n');

  } catch (migrationError) {
    console.error('\n❌ Migration failed!\n');
    console.error('Error:', migrationError.message);
    console.error('\nPossible reasons:');
    console.error('  1. PostgreSQL service not running');
    console.error('  2. Wrong DATABASE_URL');
    console.error('  3. Connection timeout');
    console.error('  4. Database permissions issue\n');

    // Check specific error types
    const errorMsg = migrationError.message || '';
    if (errorMsg.includes('P1001')) {
      console.error('❌ Cannot reach database server');
      console.error('   Database hostname might be wrong or database is not running\n');
    }

    if (errorMsg.includes('P1003')) {
      console.error('❌ Database does not exist');
      console.error('   Create PostgreSQL service on Railway first\n');
    }

    console.log('⚠️  Starting server WITHOUT migrations...');
    console.log('   Server will run but database operations will fail!\n');
  }

} catch (parseError) {
  console.error('❌ Invalid DATABASE_URL format!\n');
  console.error('Expected: postgresql://USER:PASSWORD@HOST:PORT/DATABASE\n');
  console.log('⚠️  Starting server without database...\n');
}

// Start the server
console.log('Starting Express server...\n');
await import('./dist/index.js');
