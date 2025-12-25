import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import * as serviceWorkerRegistration from './utils/registerServiceWorker';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/**
 * Show a non-blocking update notification for PWA updates.
 */
function showUpdateNotification(registration: ServiceWorkerRegistration) {
  const notification = document.createElement('div');
  notification.id = 'pwa-update-notification';
  notification.className = 'fixed bottom-4 right-4 bg-primary-600 text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-4 animate-fade-in';
  notification.innerHTML = `
    <span>Доступна новая версия!</span>
    <button id="pwa-update-btn" class="bg-white text-primary-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
      Обновить
    </button>
    <button id="pwa-dismiss-btn" class="text-white/80 hover:text-white transition-colors" aria-label="Закрыть">
      ✕
    </button>
  `;
  document.body.appendChild(notification);

  document.getElementById('pwa-update-btn')?.addEventListener('click', () => {
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  });

  document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
    notification.remove();
  });
}

// Register service worker for PWA support
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('[PWA] Service worker registered successfully');
  },
  onUpdate: (registration) => {
    console.log('[PWA] New version available');
    showUpdateNotification(registration);
  },
  onOffline: () => {
    console.log('[PWA] App is running in offline mode');
  },
  onOnline: () => {
    console.log('[PWA] App is back online');
  },
});
