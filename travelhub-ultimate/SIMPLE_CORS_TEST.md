# 🚀 ПРОСТОЙ ТЕСТ CORS (3 шага)

## Шаг 1: Откройте фронтенд
```
https://daten3.onrender.com
```

## Шаг 2: Откройте консоль
Нажмите `F12` → вкладка **Console**

## Шаг 3: Вставьте этот код и нажмите Enter

```javascript
fetch('https://daten3-1.onrender.com/api/health', {
  credentials: 'include'
})
.then(r => {
  console.log('✅ Status:', r.status);
  console.log('✅ CORS Origin:', r.headers.get('access-control-allow-origin'));
  console.log('✅ Credentials:', r.headers.get('access-control-allow-credentials'));
  return r.json();
})
.then(data => console.log('✅ Data:', data))
.catch(e => console.log('❌ Error:', e.message));
```

---

## Что должно быть:

### ✅ РАБОТАЕТ:
```
✅ Status: 200
✅ CORS Origin: https://daten3.onrender.com
✅ Credentials: true
✅ Data: {status: "ok", ...}
```

### ❌ НЕ РАБОТАЕТ:
```
❌ Error: Failed to fetch
```
или
```
✅ CORS Origin: null
```

---

**Скопируйте код и пришлите результат!**
