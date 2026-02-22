/**
 * UsersService - Servicio para gestion de usuarios
 *
 * APIs implementadas:
 * - API-067: GET /api/v1/users (listar usuarios)
 * - API-068: POST /api/v1/users (crear usuario)
 * - API-069: PUT /api/v1/users/:id (actualizar usuario)
 * - API-070: DELETE /api/v1/users/:id (eliminar usuario)
 *
 * Segun documentacion: docs/integracion/04_apis_lista.md
 */
import apiClient from '@lib/api'

export class UsersService {
  /**
   * API-067: Listar usuarios
   * GET /api/v1/users
   *
   * @param {Object} params - Parametros de consulta
   * @param {number} params.page - Numero de pagina (default: 1)
   * @param {number} params.pageSize - Tamaño de pagina (default: 20)
   * @param {number} params.roleId - Filtro por rol
   * @param {number} params.branchId - Filtro por sede
   * @param {boolean} params.isActive - Filtro por estado activo/inactivo
   * @returns {Promise<Object>} { success, data, pagination }
   */
  static async listUsers(params = {}) {
    try {
      const response = await apiClient.get('/users', { params })
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || {}
      }
    } catch (error) {
      console.error('Error en listUsers:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Error al obtener lista de usuarios',
        data: [],
        pagination: {}
      }
    }
  }

  /**
   * API-068: Crear usuario
   * POST /api/v1/users
   *
   * @param {Object} userData - Datos del usuario
   * @param {string} userData.name - Nombre completo
   * @param {string} userData.email - Email (identificador unico)
   * @param {string} userData.password - Contraseña (min 6 caracteres)
   * @param {number} userData.roleId - ID del rol
   * @param {number} userData.branchId - ID de la sede (opcional)
   * @param {string} userData.phone - Telefono (opcional)
   * @returns {Promise<Object>} { success, data }
   */
  static async createUser(userData) {
    try {
      const response = await apiClient.post('/users', userData)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error en createUser:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Error al crear usuario'
      }
    }
  }

  /**
   * API-069: Actualizar usuario
   * PUT /api/v1/users/:id
   *
   * @param {number} userId - ID del usuario
   * @param {Object} userData - Datos a actualizar
   * @param {string} userData.name - Nombre completo (opcional)
   * @param {string} userData.email - Email (opcional)
   * @param {string} userData.password - Contraseña (opcional, solo si se quiere cambiar)
   * @param {number} userData.roleId - ID del rol (opcional)
   * @param {number} userData.branchId - ID de la sede (opcional)
   * @param {string} userData.phone - Telefono (opcional)
   * @param {boolean} userData.isActive - Estado activo/inactivo (opcional)
   * @returns {Promise<Object>} { success, data }
   */
  static async updateUser(userId, userData) {
    try {
      const response = await apiClient.put(`/users/${userId}`, userData)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error en updateUser:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Error al actualizar usuario'
      }
    }
  }

  /**
   * API-070: Eliminar usuario
   * DELETE /api/v1/users/:id
   *
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} { success }
   */
  static async deleteUser(userId) {
    try {
      const response = await apiClient.delete(`/users/${userId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error en deleteUser:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Error al eliminar usuario'
      }
    }
  }

  /**
   * Asignar sede a un usuario (wrapper de updateUser para cambio de sede)
   * @param {number} userId - ID del usuario
   * @param {number} branchId - ID de la sede
   * @returns {Promise<Object>} { success, data }
   */
  static async assignBranch(userId, branchId) {
    return this.updateUser(userId, { branchId })
  }

  /**
   * Activar/desactivar usuario (wrapper de updateUser para toggle de estado)
   * @param {number} userId - ID del usuario
   * @param {boolean} isActive - Nuevo estado
   * @returns {Promise<Object>} { success, data }
   */
  static async toggleUserStatus(userId, isActive) {
    return this.updateUser(userId, { isActive })
  }
}
