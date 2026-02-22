/**
 * Auth Service
 * Servicio de autenticación que conecta con las APIs del backend
 * APIs utilizadas: API-001 (login), API-002 (logout), API-003 (verifySession)
 */
import apiClient from '@/lib/api';

/**
 * API-001: Iniciar sesión
 * POST /api/v1/auth/login
 * @param {string} email - Email o nombre del negocio (para clientes)
 * @param {string} password - Contraseña
 * @returns {Promise<Object>} - Datos del usuario y token
 */
export const login = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', {
      email,
      password
    });

    // Guardar token en localStorage
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error en login:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error al iniciar sesión'
    };
  }
};

/**
 * API-002: Cerrar sesión
 * POST /api/v1/auth/logout
 * @returns {Promise<Object>}
 */
export const logout = async () => {
  try {
    await apiClient.post('/auth/logout');

    // Limpiar token del localStorage
    localStorage.removeItem('auth_token');

    return {
      success: true
    };
  } catch (error) {
    console.error('Error en logout:', error);
    // Aún así limpiamos el token local
    localStorage.removeItem('auth_token');

    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error al cerrar sesión'
    };
  }
};

/**
 * API-003: Verificar sesión activa
 * GET /api/v1/auth/me
 * @returns {Promise<Object>} - Datos del usuario si la sesión es válida
 */
export const verifySession = async () => {
  try {
    const response = await apiClient.get('/auth/me');

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error verificando sesión:', error);

    // Si el token es inválido, limpiarlo
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
    }

    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Sesión inválida'
    };
  }
};

/**
 * Verificar si hay un token guardado
 * @returns {boolean}
 */
export const hasToken = () => {
  return !!localStorage.getItem('auth_token');
};
