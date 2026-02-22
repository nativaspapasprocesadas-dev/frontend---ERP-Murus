/**
 * MeasuresService - Servicio para gestionar medidas
 *
 * APIs implementadas:
 * - API-049: GET /api/v1/measures (listar medidas)
 * - API-050: POST /api/v1/measures (crear medida)
 * - API-051: PUT /api/v1/measures/:id (actualizar medida)
 * - API-052: DELETE /api/v1/measures/:id (eliminar medida)
 *
 * Según documentación: docs/integracion/04_apis_lista.md (líneas 3165-3221)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4020/api/v1'
const MEASURES_ENDPOINT = `${API_BASE_URL}/measures`

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
 * API-049: GET /api/v1/measures
 * Listar medidas con paginación
 */
export const listMeasures = async ({ page = 1, pageSize = 100 } = {}) => {
  const params = new URLSearchParams()

  if (page) params.append('page', page)
  if (pageSize) params.append('pageSize', pageSize)

  const url = `${MEASURES_ENDPOINT}?${params.toString()}`
  return await fetchWithAuth(url, { method: 'GET' })
}

/**
 * API-050: POST /api/v1/measures
 * Crear nueva medida
 */
export const createMeasure = async (measureData) => {
  return await fetchWithAuth(MEASURES_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(measureData)
  })
}

/**
 * API-051: PUT /api/v1/measures/:id
 * Actualizar medida existente
 */
export const updateMeasure = async (id, measureData) => {
  const url = `${MEASURES_ENDPOINT}/${id}`
  return await fetchWithAuth(url, {
    method: 'PUT',
    body: JSON.stringify(measureData)
  })
}

/**
 * API-052: DELETE /api/v1/measures/:id
 * Eliminar medida (soft delete)
 */
export const deleteMeasure = async (id) => {
  const url = `${MEASURES_ENDPOINT}/${id}`
  return await fetchWithAuth(url, {
    method: 'DELETE'
  })
}

export default {
  listMeasures,
  createMeasure,
  updateMeasure,
  deleteMeasure
}
