/**
 * Routes Service - Integración con API-036, API-037, API-038, API-039, API-040, API-041, API-042, API-043
 * Endpoints definidos en ./docs/integracion/04_apis_lista.md
 *
 * Base URL: /api/v1/routes
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4020/api/v1'
const ROUTES_ENDPOINT = `${API_BASE_URL}/routes`

/**
 * Helper para hacer peticiones con token JWT
 */
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('auth_token')

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * API-036: GET /api/v1/routes
 * Listar rutas del día con paginación y filtros
 * @param {Object} options - Opciones de filtrado
 * @param {boolean} options.includeHistory - Si es true, trae rutas de los últimos 60 días
 */
export const listRoutes = async ({ page = 1, pageSize = 20, status, date, dateFrom, dateTo, branchId, includeHistory } = {}) => {
  const params = new URLSearchParams()

  if (page) params.append('page', page)
  if (pageSize) params.append('pageSize', pageSize)
  if (status) params.append('status', status)
  if (date) params.append('date', date)
  if (dateFrom) params.append('dateFrom', dateFrom)
  if (dateTo) params.append('dateTo', dateTo)
  if (branchId) params.append('branchId', branchId)
  if (includeHistory) params.append('includeHistory', 'true')

  const url = `${ROUTES_ENDPOINT}?${params.toString()}`
  return await fetchWithAuth(url, { method: 'GET' })
}

/**
 * API-037: GET /api/v1/routes/:id
 * Obtener detalle de una ruta
 */
export const getRouteById = async (id) => {
  const url = `${ROUTES_ENDPOINT}/${id}`
  return await fetchWithAuth(url, { method: 'GET' })
}

/**
 * API-038: POST /api/v1/routes/:id/dispatch
 * Asignar chofer y enviar ruta (cambiar estado a ENVIADA)
 */
export const dispatchRoute = async (id, driverId) => {
  const url = `${ROUTES_ENDPOINT}/${id}/dispatch`
  return await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify({ driverId })
  })
}

/**
 * API-039: POST /api/v1/routes/:id/complete
 * Completar ruta (cambiar estado a COMPLETADA)
 */
export const completeRoute = async (id) => {
  const url = `${ROUTES_ENDPOINT}/${id}/complete`
  return await fetchWithAuth(url, {
    method: 'POST'
  })
}

/**
 * POST /api/v1/routes/:id/reopen
 * Reabrir ruta (revertir envío para agregar más pedidos)
 */
export const reopenRoute = async (id) => {
  const url = `${ROUTES_ENDPOINT}/${id}/reopen`
  return await fetchWithAuth(url, {
    method: 'POST'
  })
}

/**
 * API-040: GET /api/v1/routes/config
 * Listar configuraciones de rutas
 */
export const listRouteConfigs = async () => {
  const url = `${ROUTES_ENDPOINT}/config`
  return await fetchWithAuth(url, { method: 'GET' })
}

/**
 * API-041: POST /api/v1/routes/config
 * Crear nueva configuración de ruta
 * @param {Object} configData - { name, color, description, branchId, horaLimiteRecepcion }
 */
export const createRouteConfig = async (configData) => {
  const url = `${ROUTES_ENDPOINT}/config`
  return await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(configData)
  })
}

/**
 * API-042: PUT /api/v1/routes/config/:id
 * Actualizar configuración de ruta
 * @param {number} id - ID de la configuración
 * @param {Object} configData - { name, color, description, isActive, horaLimiteRecepcion }
 */
export const updateRouteConfig = async (id, configData) => {
  const url = `${ROUTES_ENDPOINT}/config/${id}`
  return await fetchWithAuth(url, {
    method: 'PUT',
    body: JSON.stringify(configData)
  })
}

/**
 * API-043: GET /api/v1/routes/:id/export/pdf
 * Exportar ruta a PDF
 */
export const exportRouteToPDF = async (id) => {
  const url = `${ROUTES_ENDPOINT}/${id}/export/pdf`
  const token = localStorage.getItem('auth_token')

  const headers = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    method: 'GET',
    headers
  })

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`)
  }

  return response.blob()
}

export default {
  listRoutes,
  getRouteById,
  dispatchRoute,
  completeRoute,
  reopenRoute,
  listRouteConfigs,
  createRouteConfig,
  updateRouteConfig,
  exportRouteToPDF
}
