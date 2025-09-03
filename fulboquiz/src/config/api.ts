// Configuración de la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const apiConfig = {
  baseUrl: API_BASE_URL,
  endpoints: {
    questions: '/api/quiz/questions',
    teams: '/api/get',
    list: '/api/list'
  }
};

// Helper function para construir URLs completas
export const buildApiUrl = (endpoint: string, params?: Record<string, string | number>) => {
  let url = `${apiConfig.baseUrl}${endpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, value.toString());
    });
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};
