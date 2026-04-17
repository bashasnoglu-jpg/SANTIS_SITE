import './index.css';
import { bootLegacyBridge } from './legacy/legacy-bridge';
import './legacy/santis-whisper-entry';

// ... mevcut React render akışı (örnek skeleton)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Varsayılan

bootLegacyBridge();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
