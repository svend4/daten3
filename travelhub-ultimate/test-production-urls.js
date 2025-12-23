#!/usr/bin/env node

const https = require('https');

const FRONTEND_URL = 'https://daten3.onrender.com';
const BACKEND_URL = 'https://daten3-1.onrender.com';

function testUrl(url, path = '/') {
  return new Promise((resolve, reject) => {
    const fullUrl = url + path;
    console.log(`\n🔍 Тестирую: ${fullUrl}`);
    
    https.get(fullUrl, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   ✅ Статус: ${res.statusCode}`);
        console.log(`   📄 Content-Type: ${res.headers['content-type']}`);
        if (data.length < 200) {
          console.log(`   📦 Response: ${data.substring(0, 100)}`);
        } else {
          console.log(`   📦 Response size: ${data.length} bytes`);
        }
        resolve({ status: res.statusCode, data });
      });
    }).on('error', (err) => {
      console.log(`   ❌ Ошибка: ${err.message}`);
      reject(err);
    }).on('timeout', () => {
      console.log(`   ⏱️  Timeout`);
      reject(new Error('Timeout'));
    });
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🧪 Тест Production URLs');
  console.log('═══════════════════════════════════════════════════════');

  try {
    console.log('\n📱 FRONTEND (daten3.onrender.com):');
    await testUrl(FRONTEND_URL);
  } catch (e) {
    console.log('   Frontend недоступен');
  }

  try {
    console.log('\n🔧 BACKEND API (daten3-1.onrender.com):');
    await testUrl(BACKEND_URL, '/api/health');
  } catch (e) {
    console.log('   Backend API недоступен');
  }

  try {
    console.log('\n🔐 BACKEND CSRF Token:');
    await testUrl(BACKEND_URL, '/api/auth/csrf-token');
  } catch (e) {
    console.log('   CSRF endpoint недоступен');
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ✨ Тестирование завершено');
  console.log('═══════════════════════════════════════════════════════\n');
}

main();
