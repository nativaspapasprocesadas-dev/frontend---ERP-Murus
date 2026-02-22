/**
 * Dashboard Service - API-004
 * Servicio para obtener estadisticas del dashboard
 */
import apiClient from '@lib/api';

/**
 * Obtener estadisticas del dashboard
 * @param {Object} params - Parametros opcionales
 * @param {string} params.branchId - ID de sede (opcional, para SuperAdmin)
 * @returns {Promise<Object>} Estadisticas del dashboard
 */
export const getDashboardStats = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (params.branchId) {
      queryParams.append('branchId', params.branchId);
    }

    const url = `/dashboard/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(url);

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error obteniendo estadisticas del dashboard:', error);
    throw {
      success: false,
      error: error.response?.data?.error || 'Error al obtener estadisticas del dashboard'
    };
  }
};

const DashboardService = {
  getDashboardStats
};

export default DashboardService;
