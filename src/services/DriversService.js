/**
 * Drivers Service - Integración con API-032, API-033, API-034, API-035
 * Endpoints definidos en ./docs/integracion/04_apis_lista.md
 *
 * Base URL: /api/v1/drivers
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4020/api/v1'
const DRIVERS_ENDPOINT = `${API_BASE_URL}/drivers`

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
 * API-032: GET /api/v1/drivers
 * Listar choferes con paginación y filtros
 */
export const listDrivers = async ({ page = 1, pageSize = 20, isActive, branchId } = {}) => {
  const params = new URLSearchParams()

  if (page) params.append('page', page)
  if (pageSize) params.append('pageSize', pageSize)
  if (isActive !== undefined) params.append('isActive', isActive)
  if (branchId) params.append('branchId', branchId)

  const url = `${DRIVERS_ENDPOINT}?${params.toString()}`
  return await fetchWithAuth(url, { method: 'GET' })
}

/**
 * API-033: POST /api/v1/drivers
 * Crear nuevo chofer
 */
export const createDriver = async (driverData) => {
  return await fetchWithAuth(DRIVERS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(driverData)
  })
}

/**
 * API-034: PUT /api/v1/drivers/:id
 * Actualizar chofer existente
 */
export const updateDriver = async (id, driverData) => {
  const url = `${DRIVERS_ENDPOINT}/${id}`
  return await fetchWithAuth(url, {
    method: 'PUT',
    body: JSON.stringify(driverData)
  })
}

/**
 * API-035: DELETE /api/v1/drivers/:id
 * Eliminar chofer (soft delete)
 */
export const deleteDriver = async (id) => {
  const url = `${DRIVERS_ENDPOINT}/${id}`
  return await fetchWithAuth(url, {
    method: 'DELETE'
  })
}

/**
 * Helper: Desactivar chofer (actualiza isActive a false)
 */
export const deactivateDriver = async (id) => {
  return await updateDriver(id, { isActive: false })
}

/**
 * Helper: Reactivar chofer (actualiza isActive a true)
 */
export const reactivateDriver = async (id) => {
  return await updateDriver(id, { isActive: true })
}

export default {
  listDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  deactivateDriver,
  reactivateDriver
}
