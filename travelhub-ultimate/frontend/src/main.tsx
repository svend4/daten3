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

// Register service worker for PWA support
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('[PWA] Service worker registered successfully');
  },
  onUpdate: (registration) => {
    console.log('[PWA] New version available');
    // Optionally show update notification to user
    if (confirm('New version available! Reload to update?')) {
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  },
  onOffline: () => {
    console.log('[PWA] App is running in offline mode');
  },
  onOnline: () => {
    console.log('[PWA] App is back online');
  },
});
