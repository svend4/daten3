// Diagnostic script to check DATABASE_URL
console.log('=== DATABASE CONNECTION DIAGNOSTIC ===\n');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL is NOT SET!');
  console.error('   This is the problem - Railway doesn\'t have DATABASE_URL variable\n');
  process.exit(1);
}

console.log('✅ DATABASE_URL is set\n');

// Parse URL safely
try {
  const url = new URL(dbUrl);

  console.log('Database Configuration:');
  console.log('  Protocol:', url.protocol);
  console.log('  Host:', url.hostname);
  console.log('  Port:', url.port || '5432');
  console.log('  Database:', url.pathname.slice(1));
  console.log('  Username:', url.username);
  console.log('  Password:', url.password ? '***' + url.password.slice(-4) : 'NOT SET');
  console.log('\n');

  // Check if using internal Railway hostname
  if (url.hostname.includes('.railway.internal')) {
    console.log('⚠️  USING INTERNAL HOSTNAME:', url.hostname);
    console.log('   This might be the issue!\n');

    if (url.hostname === 'daten3.railway.internal') {
      console.error('❌ WRONG HOSTNAME: daten3.railway.internal');
      console.error('   This is not a valid PostgreSQL hostname!');
      console.error('\n   SOLUTION:');
      console.error('   1. Go to Railway Dashboard → Postgres service → Variables');
      console.error('   2. Copy the DATABASE_URL');
      console.error('   3. Add to daten3-travelbackend → Variables → DATABASE_URL');
      console.error('\n   Expected hostname format:');
      console.error('   - containers-us-west-XXX.railway.app (public)');
      console.error('   - OR postgres.railway.internal (private networking)\n');
      process.exit(1);
    }
  }

  // Check if hostname looks valid
  if (!url.hostname || url.hostname === 'undefined') {
    console.error('❌ INVALID HOSTNAME:', url.hostname);
    console.error('   DATABASE_URL is malformed!\n');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL format looks correct\n');
  console.log('Attempting to connect...\n');

  // Try to connect with Prisma
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  prisma.$connect()
    .then(async () => {
      console.log('✅ CONNECTION SUCCESSFUL!\n');

      // Check if migrations are applied
      const result = await prisma.$queryRaw`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `;

      console.log(`✅ Database has ${result.length} tables\n`);

      if (result.length === 0) {
        console.log('⚠️  No tables found - migrations not applied yet');
        console.log('   Run: npx prisma migrate deploy\n');
      } else {
        console.log('Tables:');
        result.forEach(t => console.log('  -', t.table_name));
        console.log('\n');
      }

      await prisma.$disconnect();
      console.log('✅ ALL CHECKS PASSED - Database is ready!\n');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ CONNECTION FAILED!\n');
      console.error('Error:', err.message);
      console.error('\nPossible reasons:');
      console.error('  1. PostgreSQL service not running on Railway');
      console.error('  2. Wrong DATABASE_URL (check Variables in Railway)');
      console.error('  3. Firewall/network issue');
      console.error('  4. Database doesn\'t exist\n');

      if (err.message.includes('ENOTFOUND')) {
        console.error('❌ HOSTNAME NOT FOUND:', url.hostname);
        console.error('   The database server doesn\'t exist at this address!\n');
      }

      if (err.message.includes('ETIMEDOUT') || err.message.includes('ECONNREFUSED')) {
        console.error('❌ CONNECTION TIMEOUT');
        console.error('   Database server is not responding\n');
      }

      process.exit(1);
    });

} catch (err) {
  console.error('❌ INVALID DATABASE_URL FORMAT!\n');
  console.error('Error:', err.message);
  console.error('\nExpected format:');
  console.error('  postgresql://USER:PASSWORD@HOST:PORT/DATABASE');
  console.error('\nExample:');
  console.error('  postgresql://postgres:abc123@containers-us-west-123.railway.app:5432/railway\n');
  process.exit(1);
}
