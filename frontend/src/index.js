import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Force refresh mechanism and debug logging
console.log('=== APP STARTUP DEBUG ===');
console.log('App starting at:', new Date().toISOString());
console.log('Current URL:', window.location.href);
console.log('User Agent:', navigator.userAgent);
console.log('========================');

// Force cache refresh
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
