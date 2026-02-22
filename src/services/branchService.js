/**
 * Branch Service
 * Servicio para gestión de sedes/sucursales
 * APIs utilizadas: API-071, API-072, API-073, API-074
 */
import apiClient from '@/lib/api';

/**
 * API-071: Listar sedes
 * GET /api/v1/branches
 * @param {Object} params - Parámetros de consulta
 * @param {number} params.page - Número de página
 * @param {number} params.pageSize - Tamaño de página
 * @param {boolean} params.isActive - Filtrar solo sedes activas
 * @returns {Promise<Object>} - Lista de sedes
 */
export const listBranches = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (params.page !== undefined) {
      queryParams.append('page', params.page);
    }
    if (params.pageSize !== undefined) {
      queryParams.append('pageSize', params.pageSize);
    }
    if (params.isActive !== undefined) {
      queryParams.append('isActive', params.isActive);
    }

    const url = `/branches${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(url);

    return {
      success: true,
      data: response.data.data || [],
      pagination: response.data.pagination || {}
    };
  } catch (error) {
    console.error('Error listando sedes:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error al listar sedes',
      data: []
    };
  }
};

/**
 * Obtener solo sedes activas (helper)
 * @returns {Promise<Object>} - Lista de sedes activas
 */
export const getActiveBranches = async () => {
  return listBranches({ isActive: true, pageSize: 100 });
};

/**
 * API-072: Crear nueva sede
 * POST /api/v1/branches
 * @param {Object} branchData - Datos de la sede
 * @param {string} branchData.name - Nombre de la sede (requerido)
 * @param {string} branchData.code - Código de la sede
 * @param {string} branchData.address - Dirección
 * @param {string} branchData.phone - Teléfono
 * @param {string} branchData.email - Email
 * @param {string} branchData.manager - Nombre del encargado
 * @param {boolean} branchData.isMain - Es sede principal
 * @param {string} branchData.color - Color identificador
 * @returns {Promise<Object>} - Sede creada
 */
export const createBranch = async (branchData) => {
  try {
    const response = await apiClient.post('/branches', branchData);

    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Error creando sede:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error al crear sede'
    };
  }
};

/**
 * API-073: Actualizar sede existente
 * PUT /api/v1/branches/:id
 * @param {number} id - ID de la sede
 * @param {Object} updates - Campos a actualizar
 * @param {string} updates.name - Nombre de la sede
 * @param {string} updates.address - Dirección
 * @param {string} updates.phone - Teléfono
 * @param {string} updates.email - Email
 * @param {string} updates.manager - Nombre del encargado
 * @param {boolean} updates.isMain - Es sede principal
 * @param {string} updates.color - Color identificador
 * @param {boolean} updates.isActive - Estado activo/inactivo
 * @returns {Promise<Object>} - Sede actualizada
 */
export const updateBranch = async (id, updates) => {
  try {
    const response = await apiClient.put(`/branches/${id}`, updates);

    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Error actualizando sede:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error al actualizar sede'
    };
  }
};

/**
 * API-074: Eliminar sede
 * DELETE /api/v1/branches/:id
 * @param {number} id - ID de la sede
 * @returns {Promise<Object>} - Resultado de la eliminación
 */
export const deleteBranch = async (id) => {
  try {
    const response = await apiClient.delete(`/branches/${id}`);

    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Error eliminando sede:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error al eliminar sede'
    };
  }
};
