// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext'; // This AuthProvider is actually needed here to wrap App
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* AuthProvider must wrap App if it uses useAuth directly */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);