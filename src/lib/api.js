/**
 * API Client Configuration
 * Cliente HTTP para comunicación con el backend
 */
import axios from 'axios';

// URL base del backend desde variable de entorno o default
// Puerto 4020 es el backend real, 3001 era JSON-server (deprecated)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4020/api/v1';

// Crear instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para agregar token de autenticación
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejo de errores global
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejo de errores de autenticación
    if (error.response?.status === 401) {
      // Token expirado o inválido
      // Limpiar token de autenticación
      localStorage.removeItem('auth_token');
      // IMPORTANTE: Limpiar también el storage de Zustand para evitar loop de redirección
      // El store de Zustand persiste isAuthenticated en 'auth-storage'
      localStorage.removeItem('auth-storage');

      // Solo redirigir si no estamos ya en /login para evitar loop
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Manejo de errores de red
    if (!error.response) {
      console.error('Error de red:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
