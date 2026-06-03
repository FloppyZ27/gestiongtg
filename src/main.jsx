import React from 'react'
import ReactDOM from 'react-dom/client'

// Unregister stale service workers and clear caches to prevent duplicate React copies
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((sw) => sw.unregister());
  });
}
if (typeof caches !== 'undefined') {
  caches.keys().then((keys) => {
    keys.forEach((key) => caches.delete(key));
  });
}
import App from '@/App.jsx'
import '@/index.css'

// Suppress harmless ResizeObserver errors and errors without stack traces
window.addEventListener('error', (event) => {
  if (!event.error || !event.error.stack) { event.stopImmediatePropagation(); event.preventDefault(); return; }
  if (event.message && event.message.includes('ResizeObserver')) { event.stopImmediatePropagation(); event.preventDefault(); }
}, true);

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>,
)

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}