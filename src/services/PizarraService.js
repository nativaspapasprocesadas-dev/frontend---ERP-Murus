/**
 * Pizarra Service - Integracion con API-044
 * Endpoint: GET /api/v1/production/board
 *
 * Obtiene datos de la pizarra de produccion:
 * - Pedidos del dia con detalles expandidos (especie, medida, presentacion)
 * - Rutas activas del dia
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4020/api/v1'
const PRODUCTION_ENDPOINT = `${API_BASE_URL}/production`

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
 * API-044: GET /api/v1/production/board
 * Obtener pizarra de produccion
 *
 * @param {Object} params - Parametros de consulta
 * @param {string} params.date - Fecha (YYYY-MM-DD), default: hoy
 * @param {number} params.branchId - ID de sede (opcional)
 *
 * @returns {Promise<Object>} Datos de la pizarra
 *   - success: boolean
 *   - date: string
 *   - pedidos: Array<Pedido> - Pedidos con detalles expandidos
 *   - rutas: Array<Ruta> - Rutas activas del dia
 *   - stats: Object - Estadisticas
 */
export const getProductionBoard = async ({ date, branchId } = {}) => {
  const params = new URLSearchParams()

  if (date) params.append('date', date)
  if (branchId) params.append('branchId', branchId)

  const queryString = params.toString()
  const url = `${PRODUCTION_ENDPOINT}/board${queryString ? '?' + queryString : ''}`

  const result = await fetchWithAuth(url, { method: 'GET' })
  return result
}

/**
 * GET /api/v1/production/items-listos
 * Obtener items marcados como listos para la pizarra
 *
 * @param {Object} params - Parametros de consulta
 * @param {string} params.date - Fecha (YYYY-MM-DD), default: hoy
 * @param {number} params.branchId - ID de sede (opcional)
 *
 * @returns {Promise<Object>} Items listos
 */
export const getItemsListos = async ({ date, branchId } = {}) => {
  const params = new URLSearchParams()

  if (date) params.append('date', date)
  if (branchId) params.append('branchId', branchId)

  const queryString = params.toString()
  const url = `${PRODUCTION_ENDPOINT}/items-listos${queryString ? '?' + queryString : ''}`

  return await fetchWithAuth(url, { method: 'GET' })
}

/**
 * POST /api/v1/production/toggle-item-listo
 * Marcar o desmarcar un detalle de pedido como listo
 *
 * @param {Object} data - Datos del item
 * @param {number} data.detalleId - ID del detalle de pedido
 *
 * @returns {Promise<Object>} Resultado del toggle { id, listo }
 */
export const toggleItemListo = async ({ detalleId }) => {
  const url = `${PRODUCTION_ENDPOINT}/toggle-item-listo`

  return await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify({ detalleId })
  })
}

/**
 * POST /api/v1/production/toggle-items-listo-batch
 * Marcar o desmarcar MULTIPLES detalles de pedido como listos en una sola operacion
 *
 * @param {Object} data - Datos del batch
 * @param {number[]} data.detalleIds - IDs de los detalles a toggle
 * @param {boolean} data.targetListo - Valor objetivo (true = marcar como listo, false = desmarcar)
 *
 * @returns {Promise<Object>} Resultado del batch
 */
export const toggleItemsListoBatch = async ({ detalleIds, targetListo }) => {
  const url = `${PRODUCTION_ENDPOINT}/toggle-items-listo-batch`

  return await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify({ detalleIds, targetListo })
  })
}

export default {
  getProductionBoard,
  getItemsListos,
  toggleItemListo,
  toggleItemsListoBatch
}
