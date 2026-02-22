/**
 * PresentationsService - Servicio para gestionar presentaciones
 *
 * APIs implementadas:
 * - API-053: GET /api/v1/presentations (listar presentaciones)
 * - API-054: POST /api/v1/presentations (crear presentación)
 * - API-055: PUT /api/v1/presentations/:id (actualizar presentación)
 * - API-056: DELETE /api/v1/presentations/:id (eliminar presentación)
 *
 * Según documentación: docs/integracion/04_apis_lista.md (líneas 3374-3430)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4020/api/v1'
const PRESENTATIONS_ENDPOINT = `${API_BASE_URL}/presentations`

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
 * API-053: GET /api/v1/presentations
 * Listar presentaciones con paginación
 */
export const listPresentations = async ({ page = 1, pageSize = 100 } = {}) => {
  const params = new URLSearchParams()

  if (page) params.append('page', page)
  if (pageSize) params.append('pageSize', pageSize)

  const url = `${PRESENTATIONS_ENDPOINT}?${params.toString()}`
  return await fetchWithAuth(url, { method: 'GET' })
}

/**
 * API-054: POST /api/v1/presentations
 * Crear nueva presentación
 */
export const createPresentation = async (presentationData) => {
  return await fetchWithAuth(PRESENTATIONS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(presentationData)
  })
}

/**
 * API-055: PUT /api/v1/presentations/:id
 * Actualizar presentación existente
 */
export const updatePresentation = async (id, presentationData) => {
  const url = `${PRESENTATIONS_ENDPOINT}/${id}`
  return await fetchWithAuth(url, {
    method: 'PUT',
    body: JSON.stringify(presentationData)
  })
}

/**
 * API-056: DELETE /api/v1/presentations/:id
 * Eliminar presentación (soft delete)
 */
export const deletePresentation = async (id) => {
  const url = `${PRESENTATIONS_ENDPOINT}/${id}`
  return await fetchWithAuth(url, {
    method: 'DELETE'
  })
}

export default {
  listPresentations,
  createPresentation,
  updatePresentation,
  deletePresentation
}
