import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import * as serviceWorkerRegistration from './utils/registerServiceWorker';

// Global error handler for debugging - shows errors before React can catch them
window.onerror = function(message, source, lineno, colno, error) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;padding:20px;z-index:99999;font-family:monospace;white-space:pre-wrap;';
  errorDiv.textContent = `GLOBAL ERROR:\n${message}\nSource: ${source}\nLine: ${lineno}:${colno}\n${error?.stack || ''}`;
  document.body.prepend(errorDiv);
  return false;
};

window.addEventListener('unhandledrejection', function(event) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:orange;color:black;padding:20px;z-index:99999;font-family:monospace;white-space:pre-wrap;';
  errorDiv.textContent = `UNHANDLED PROMISE REJECTION:\n${event.reason}`;
  document.body.prepend(errorDiv);
});

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
