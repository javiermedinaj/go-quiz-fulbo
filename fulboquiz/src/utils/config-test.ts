// Script de verificación de configuración
console.log('🔧 Configuración de la aplicación:');
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080');
console.log('App Name:', import.meta.env.VITE_APP_NAME || 'FutbolQuiz');
console.log('App Version:', import.meta.env.VITE_APP_VERSION || '1.0.0');
console.log('Environment:', import.meta.env.MODE);

// Función para testear la conexión a la API
export const testApiConnection = async () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  
  try {
    console.log('🌐 Probando conexión a:', baseUrl);
    const response = await fetch(`${baseUrl}/`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API conectada correctamente:', data.message);
      return true;
    } else {
      console.log('❌ Error de conexión:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Error de red:', error);
    return false;
  }
};
