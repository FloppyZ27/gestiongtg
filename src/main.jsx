import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Suppress harmless ResizeObserver errors that have no stack trace
const _origError = window.onerror;
window.onerror = function(message, source, lineno, colno, error) {
  if (message && typeof message === 'string' && message.includes('ResizeObserver')) return true;
  if (!error || !error.stack) return true;
  if (_origError) return _origError(message, source, lineno, colno, error);
};

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