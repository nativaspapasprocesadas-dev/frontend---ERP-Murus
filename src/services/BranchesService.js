/**
 * BranchesService - API Service for Branches (Sedes)
 * Implementa API-071 (GET /api/v1/branches)
 * Segun diseño en 04_apis_lista.md linea 4522
 */
import apiClient from '@lib/api';

/**
 * Servicio para gestionar Sedes (Branches)
 */
export class BranchesService {
  /**
   * Listar sedes - API-071
   * @param {Object} params - Parametros de filtro y paginacion
   * @param {number} params.page - Numero de pagina
   * @param {number} params.pageSize - Tamaño de pagina
   * @param {boolean} params.isActive - Filtrar por sedes activas
   * @returns {Promise<Object>} { success, data, pagination }
   */
  static async listBranches({ page = 1, pageSize = 100, isActive, includeInactive = false } = {}) {
    try {
      const params = { page, pageSize };

      // Solo enviar isActive si está definido y no estamos incluyendo inactivas
      if (!includeInactive && isActive !== undefined) {
        params.isActive = isActive;
      }

      // Si queremos incluir inactivas, enviar el parámetro
      if (includeInactive) {
        params.includeInactive = true;
      }

      const response = await apiClient.get('/branches', { params });

      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      console.error('Error listando sedes:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al cargar sedes',
        data: [],
        pagination: {}
      };
    }
  }

  /**
   * Obtener sede por ID
   * @param {number} branchId - ID de la sede
   * @returns {Promise<Object>} { success, data }
   */
  static async getBranchById(branchId) {
    try {
      const response = await apiClient.get(`/branches/${branchId}`);

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error obteniendo sede:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al cargar sede',
        data: null
      };
    }
  }

  /**
   * Crear nueva sede - API-072
   * @param {Object} branchData - Datos de la sede
   * @returns {Promise<Object>} { success, data }
   */
  static async createBranch(branchData) {
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
        error: error.response?.data?.error || 'Error al crear sede',
        data: null
      };
    }
  }

  /**
   * Actualizar sede - API-073
   * @param {number} branchId - ID de la sede
   * @param {Object} branchData - Datos a actualizar
   * @returns {Promise<Object>} { success, data }
   */
  static async updateBranch(branchId, branchData) {
    try {
      const response = await apiClient.put(`/branches/${branchId}`, branchData);

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error actualizando sede:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al actualizar sede',
        data: null
      };
    }
  }

  /**
   * Eliminar sede - API-074
   * @param {number} branchId - ID de la sede
   * @returns {Promise<Object>} { success }
   */
  static async deleteBranch(branchId) {
    try {
      const response = await apiClient.delete(`/branches/${branchId}`);

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error eliminando sede:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al eliminar sede'
      };
    }
  }
}
