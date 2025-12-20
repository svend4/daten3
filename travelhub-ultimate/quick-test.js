// 🧪 Быстрый тест интеграции Frontend ↔ Backend
// Скопируйте весь этот код и вставьте в Browser Console (F12)

console.clear();
console.log('🧪 Начинаем тестирование интеграции...\n');

// Тест 1: Проверка API URL
console.log('1️⃣ Проверка API URL...');
const apiUrl = import.meta.env.VITE_API_BASE_URL;
console.log('   API URL:', apiUrl || '❌ НЕ УСТАНОВЛЕН!');

if (!apiUrl) {
  console.error('❌ VITE_API_BASE_URL не установлен!');
  console.log('   Добавьте в Railway Frontend Variables:');
  console.log('   VITE_API_BASE_URL=https://daten3-travelbackend.up.railway.app/api');
  console.log('\n   После добавления нужен redeploy frontend!');
}

// Тест 2: Backend Health Check
console.log('\n2️⃣ Тест Backend Health...');
if (apiUrl) {
  fetch(apiUrl.replace('/api', '') + '/health')
    .then(r => {
      console.log('   Status:', r.status);
      return r.json();
    })
    .then(data => {
      console.log('   ✅ Backend отвечает:', data);
      console.log('   Uptime:', Math.floor(data.uptime), 'секунд');
    })
    .catch(err => {
      console.error('   ❌ Ошибка:', err.message);
      if (err.message.includes('CORS')) {
        console.log('   Проверьте FRONTEND_URL в Backend Variables!');
      }
    });
}

// Тест 3: API Health
console.log('\n3️⃣ Тест API Health...');
if (apiUrl) {
  fetch(apiUrl + '/health')
    .then(r => {
      console.log('   Status:', r.status);
      return r.json();
    })
    .then(data => {
      console.log('   ✅ API Health:', data);
    })
    .catch(err => {
      console.error('   ❌ Ошибка:', err.message);
    });
}

// Тест 4: Hotels API
console.log('\n4️⃣ Тест Hotels API...');
if (apiUrl) {
  fetch(apiUrl + '/hotels/search')
    .then(r => {
      console.log('   Status:', r.status);
      return r.json();
    })
    .then(data => {
      console.log('   ✅ Hotels API:', data);
    })
    .catch(err => {
      console.error('   ❌ Ошибка:', err.message);
    });
}

// Тест 5: Flights API
console.log('\n5️⃣ Тест Flights API...');
if (apiUrl) {
  fetch(apiUrl + '/flights/search')
    .then(r => {
      console.log('   Status:', r.status);
      return r.json();
    })
    .then(data => {
      console.log('   ✅ Flights API:', data);
    })
    .catch(err => {
      console.error('   ❌ Ошибка:', err.message);
    });
}

// Итоговая информация
setTimeout(() => {
  console.log('\n' + '='.repeat(50));
  console.log('📊 ПРОВЕРКА ЗАВЕРШЕНА');
  console.log('='.repeat(50));
  console.log('\n✅ Если все тесты прошли успешно:');
  console.log('   - Frontend и Backend интегрированы');
  console.log('   - CORS настроен правильно');
  console.log('   - API endpoints работают\n');
  console.log('❌ Если есть ошибки:');
  console.log('   - Откройте INTEGRATION_TEST.md');
  console.log('   - Раздел "🐛 Troubleshooting"\n');
}, 3000);
