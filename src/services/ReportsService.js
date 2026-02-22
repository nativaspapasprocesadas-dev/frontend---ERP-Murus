/**
 * Reports Service - API-061 a API-066
 * Servicio para consumir APIs de reportes del backend
 */
import apiClient from '@/lib/api'

/**
 * API-061: GET /api/v1/reports/summary
 * Obtener resumen de reportes con totales, top clientes, productos y estado de cartera
 * @param {Object} params - Filtros opcionales
 * @param {string} params.dateFrom - Fecha inicio (opcional)
 * @param {string} params.dateTo - Fecha fin (opcional)
 * @param {number} params.branchId - ID de sede (opcional)
 * @returns {Promise<Object>} Resumen de reportes
 */
export const getReportsSummary = async (params = {}) => {
  const response = await apiClient.get('/reports/summary', { params })
  return response.data
}

/**
 * API-062: GET /api/v1/reports/daily-sales
 * Reporte de ventas diarias con detalles por fecha
 * @param {Object} params - Filtros obligatorios
 * @param {string} params.dateFrom - Fecha inicio (OBLIGATORIO)
 * @param {string} params.dateTo - Fecha fin (OBLIGATORIO)
 * @param {number} params.branchId - ID de sede (opcional)
 * @returns {Promise<Object>} Reporte de ventas diarias
 */
export const getDailySalesReport = async (params) => {
  if (!params.dateFrom || !params.dateTo) {
    throw new Error('dateFrom y dateTo son obligatorios')
  }
  const response = await apiClient.get('/reports/daily-sales', { params })
  return response.data
}

/**
 * API-063: GET /api/v1/reports/routes
 * Reporte de rendimiento por ruta
 * @param {Object} params - Filtros opcionales
 * @returns {Promise<Object>} Reporte de rutas
 */
export const getRoutesReport = async (params = {}) => {
  const response = await apiClient.get('/reports/routes', { params })
  return response.data
}

/**
 * API-064: GET /api/v1/reports/kilos-by-species
 * Reporte de kilos por especie
 * @param {Object} params - Filtros opcionales
 * @returns {Promise<Object>} Reporte de kilos por especie
 */
export const getKilosBySpeciesReport = async (params = {}) => {
  const response = await apiClient.get('/reports/kilos-by-species', { params })
  return response.data
}

/**
 * API-065: GET /api/v1/reports/customers
 * Reporte de clientes
 * @param {Object} params - Filtros opcionales
 * @returns {Promise<Object>} Reporte de clientes
 */
export const getCustomersReport = async (params = {}) => {
  const response = await apiClient.get('/reports/customers', { params })
  return response.data
}

/**
 * API-066: GET /api/v1/reports/customers/export
 * Exportar datos de clientes
 * @param {Object} params - Filtros opcionales
 * @returns {Promise<Blob>} Archivo de exportación
 */
export const exportCustomersData = async (params = {}) => {
  const response = await apiClient.get('/reports/customers/export', {
    params,
    responseType: 'blob'
  })
  return response.data
}

export default {
  getReportsSummary,
  getDailySalesReport,
  getRoutesReport,
  getKilosBySpeciesReport,
  getCustomersReport,
  exportCustomersData
}
