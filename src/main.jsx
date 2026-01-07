import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { initAnalytics } from './lib/analytics';
import App from './App';
import './index.css';  // IMPORTANT: This imports Tailwind styles
import './styles/responsive-utils.css';  // Mobile-first responsive utilities

// Initialize Google Analytics
initAnalytics();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
    <App />
    </HelmetProvider>
  </React.StrictMode>
);
