/**
 * Species Service - Integración con API-045, API-046, API-047, API-048
 * Endpoints definidos en ./docs/integracion/04_apis_lista.md
 *
 * Base URL: /api/v1/species
 *
 * INTEGRACIÓN:
 * - ELM-087 (Vista Gestion de Especies)
 * - ELM-088 (Tabla Lista de Especies)
 * - ELM-089 (Modal Nueva/Editar Especie)
 * - ELM-091 (Modal Confirmar Eliminacion)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4020/api/v1'
const SPECIES_ENDPOINT = `${API_BASE_URL}/species`

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
 * API-045: GET /api/v1/species
 * Listar especies con paginación
 * Roles: SUPERADMINISTRADOR, ADMINISTRADOR
 */
export const listSpecies = async ({ page = 1, pageSize = 100 } = {}) => {
  const params = new URLSearchParams()

  if (page) params.append('page', page)
  if (pageSize) params.append('pageSize', pageSize)

  const url = `${SPECIES_ENDPOINT}?${params.toString()}`
  return await fetchWithAuth(url, { method: 'GET' })
}

/**
 * API-046: POST /api/v1/species
 * Crear nueva especie
 * Roles: SUPERADMINISTRADOR, ADMINISTRADOR
 */
export const createSpecies = async (speciesData) => {
  return await fetchWithAuth(SPECIES_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(speciesData)
  })
}

/**
 * API-047: PUT /api/v1/species/:id
 * Actualizar especie existente
 * Roles: SUPERADMINISTRADOR, ADMINISTRADOR
 */
export const updateSpecies = async (id, speciesData) => {
  const url = `${SPECIES_ENDPOINT}/${id}`
  return await fetchWithAuth(url, {
    method: 'PUT',
    body: JSON.stringify(speciesData)
  })
}

/**
 * API-048: DELETE /api/v1/species/:id
 * Eliminar especie (soft delete)
 * Roles: SUPERADMINISTRADOR, ADMINISTRADOR
 */
export const deleteSpecies = async (id) => {
  const url = `${SPECIES_ENDPOINT}/${id}`
  return await fetchWithAuth(url, {
    method: 'DELETE'
  })
}

export default {
  listSpecies,
  createSpecies,
  updateSpecies,
  deleteSpecies
}
