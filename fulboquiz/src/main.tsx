import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Verificación de configuración en desarrollo
if (import.meta.env.DEV) {
  console.log('🔧 CONFIGURACIÓN DEL ENTORNO:');
  console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080');
  console.log('Mode:', import.meta.env.MODE);
  console.log('Prod:', import.meta.env.PROD);
  console.log('Dev:', import.meta.env.DEV);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
