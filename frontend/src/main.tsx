import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Temporarily disable StrictMode for scanner testing
// Re-enable after confirming scanner works properly
const isStrictModeEnabled = false; // Set to true to re-enable StrictMode

const AppComponent = isStrictModeEnabled ? (
  <React.StrictMode>
    <App />
  </React.StrictMode>
) : (
  <App />
);

ReactDOM.createRoot(document.getElementById('root')!).render(AppComponent);

