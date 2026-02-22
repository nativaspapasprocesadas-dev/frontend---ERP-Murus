/**
 * Announcements Service - Integración con API-005, API-027, API-028, API-029, API-030, API-031
 * Endpoints definidos en ./docs/integracion/04_apis_lista.md
 *
 * Base URL: /api/v1/announcements
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4020/api/v1'
const ANNOUNCEMENTS_ENDPOINT = `${API_BASE_URL}/announcements`

/**
 * Helper para hacer peticiones con token JWT (JSON)
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
 * Helper para hacer peticiones con FormData (para subida de archivos)
 */
const fetchFormDataWithAuth = async (url, formData, method = 'POST') => {
  const token = localStorage.getItem('auth_token')

  const headers = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    method,
    headers,
    body: formData
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * API-005: GET /api/v1/announcements/unread
 * Obtener comunicados no leídos del usuario autenticado
 * Roles: CLIENTE (principalmente), todos los roles pueden usarla
 */
export const getUnreadAnnouncements = async () => {
  const url = `${ANNOUNCEMENTS_ENDPOINT}/unread`
  return await fetchWithAuth(url, { method: 'GET' })
}

/**
 * API-027: GET /api/v1/announcements
 * Listar comunicados con paginación y filtros
 * Roles: SUPERADMINISTRADOR, ADMINISTRADOR, COORDINADOR, CLIENTE
 */
export const listAnnouncements = async ({ page = 1, pageSize = 20, priority } = {}) => {
  const params = new URLSearchParams()

  if (page) params.append('page', page)
  if (pageSize) params.append('pageSize', pageSize)
  if (priority) params.append('priority', priority)

  const url = `${ANNOUNCEMENTS_ENDPOINT}?${params.toString()}`
  return await fetchWithAuth(url, { method: 'GET' })
}

/**
 * API-028: POST /api/v1/announcements
 * Crear nuevo comunicado con soporte para imagen
 * Roles: SUPERADMINISTRADOR, ADMINISTRADOR, COORDINADOR
 * @param {Object} announcementData - { title, message, priority, recipientIds, imageFile? }
 */
export const createAnnouncement = async (announcementData) => {
  const formData = new FormData()

  formData.append('title', announcementData.title)
  formData.append('message', announcementData.message)
  formData.append('priority', announcementData.priority)
  formData.append('recipientIds', JSON.stringify(announcementData.recipientIds))

  // Si hay archivo de imagen, agregarlo al FormData
  if (announcementData.imageFile) {
    formData.append('imagen', announcementData.imageFile)
  }

  return await fetchFormDataWithAuth(ANNOUNCEMENTS_ENDPOINT, formData, 'POST')
}

/**
 * API-029: PUT /api/v1/announcements/:id
 * Actualizar comunicado existente con soporte para imagen
 * Roles: SUPERADMINISTRADOR, ADMINISTRADOR, COORDINADOR
 * @param {number} id - ID del comunicado
 * @param {Object} announcementData - { title?, message?, priority?, imageFile?, removeImage? }
 */
export const updateAnnouncement = async (id, announcementData) => {
  const url = `${ANNOUNCEMENTS_ENDPOINT}/${id}`
  const formData = new FormData()

  if (announcementData.title !== undefined) {
    formData.append('title', announcementData.title)
  }
  if (announcementData.message !== undefined) {
    formData.append('message', announcementData.message)
  }
  if (announcementData.priority !== undefined) {
    formData.append('priority', announcementData.priority)
  }

  // Manejar imagen
  if (announcementData.imageFile) {
    formData.append('imagen', announcementData.imageFile)
  } else if (announcementData.removeImage) {
    formData.append('removeImage', 'true')
  }

  return await fetchFormDataWithAuth(url, formData, 'PUT')
}

/**
 * API-030: DELETE /api/v1/announcements/:id
 * Eliminar comunicado (soft delete)
 * Roles: SUPERADMINISTRADOR, ADMINISTRADOR, COORDINADOR
 */
export const deleteAnnouncement = async (id) => {
  const url = `${ANNOUNCEMENTS_ENDPOINT}/${id}`
  return await fetchWithAuth(url, {
    method: 'DELETE'
  })
}

/**
 * API-031: POST /api/v1/announcements/:id/read
 * Marcar un comunicado como leído para el usuario autenticado
 * Roles: CLIENTE (principalmente), todos los roles pueden usarla
 */
export const markAnnouncementAsRead = async (id) => {
  const url = `${ANNOUNCEMENTS_ENDPOINT}/${id}/read`
  return await fetchWithAuth(url, {
    method: 'POST'
  })
}

export default {
  getUnreadAnnouncements,
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAnnouncementAsRead
}
