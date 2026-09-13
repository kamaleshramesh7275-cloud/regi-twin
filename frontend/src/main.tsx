import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Auto-activate new Service Worker immediately and reload when updated
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  }
});

// Purge legacy precache and api caches holding old mock sessions
if (typeof window !== 'undefined' && 'caches' in window) {
  caches.keys().then(keys => {
    keys.forEach(k => {
      if (k.includes('workbox-precache') || k.includes('api-read-cache')) {
        caches.delete(k).catch(() => {});
      }
    });
  }).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
