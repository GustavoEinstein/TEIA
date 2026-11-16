import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'

// --- IMPORTANTE: Isso ativa a segurança global (Interceptor do Axios) ---
import './api-usuario-login';
// -----------------------------------------------------------------------

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)