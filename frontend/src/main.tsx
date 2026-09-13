import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 1. Actively unregister any existing service workers to ensure normal reload always fetches fresh code
if (typeof window !== 'undefined') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});
  }

  // 2. Clear all browser Cache Storage (workbox, api-read-cache, etc.)
  if ('caches' in window) {
    caches.keys().then(keys => {
      keys.forEach(k => {
        caches.delete(k).catch(() => {});
      });
    }).catch(() => {});
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
