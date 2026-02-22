import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as authService from '@services/authService'
import { ROLES, PERMISOS, ROLES_MULTI_SEDE } from '@utils/constants'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      // Sede activa seleccionada (para SUPERADMINISTRADOR que puede cambiar de sede)
      sedeIdActiva: null,

      // Acciones
      login: async (usuarioInput, password) => {
        set({ isLoading: true, error: null })

        try {
          // Llamada a API-001: POST /api/v1/auth/login
          // Backend soporta login con email O nombre (nombre del negocio para clientes)
          const result = await authService.login(usuarioInput, password)

          if (!result.success) {
            throw new Error(result.error || 'Credenciales invalidas')
          }

          const apiResponse = result.data

          // Mapear campos del backend a estructura del frontend
          // Backend devuelve: { success, message, token, user: { id, name, email, role, branchId, ... } }
          // IMPORTANTE: Normalizar rol a minúsculas para coincidir con constantes ROLES
          const user = {
            id: apiResponse.user.id,
            nombre: apiResponse.user.name,
            email: apiResponse.user.email,
            rol: apiResponse.user.role?.toLowerCase() || '',
            telefono: apiResponse.user.phone || '',
            activo: true,
            sedeId: apiResponse.user.branchId || null,
            // Campos adicionales del backend
            roleId: apiResponse.user.role_id,
            sedeName: apiResponse.user.branch_name,
            sedeCode: apiResponse.user.branch_code,
            permissions: apiResponse.user.permissions,
            customer: apiResponse.user.customer
          }

          // Establecer la sede activa inicial
          // Para SUPERADMINISTRADOR: null (puede ver todas)
          // Para otros usuarios internos: su sedeId asignado
          const sedeInicial = user.sedeId || null

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            sedeIdActiva: sedeInicial
          })

          return { success: true, user }
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message
          })

          return { success: false, error: error.message }
        }
      },

      logout: async () => {
        // Llamar a API-002: POST /api/v1/auth/logout
        // El token se envía automáticamente vía interceptor de apiClient
        try {
          await authService.logout()
        } catch (error) {
          console.error('Error al invalidar sesion en backend:', error)
        }

        set({
          user: null,
          isAuthenticated: false,
          error: null,
          sedeIdActiva: null
        })
      },

      // Cambiar sede activa (solo para SUPERADMINISTRADOR)
      setSedeActiva: (sedeId) => {
        const { user } = get()
        if (!user) return false

        // Solo SUPERADMINISTRADOR puede cambiar de sede
        if (!ROLES_MULTI_SEDE.includes(user.rol)) {
          return false
        }

        set({ sedeIdActiva: sedeId })
        return true
      },

      clearError: () => {
        set({ error: null })
      },

      // Verificar sesión activa usando API-003
      verifySession: async () => {
        const token = localStorage.getItem('auth_token')

        if (!token) {
          set({
            user: null,
            isAuthenticated: false,
            sedeIdActiva: null
          })
          return false
        }

        set({ isLoading: true })

        try {
          // Llamada a API-003: GET /api/v1/auth/me
          const result = await authService.verifySession()

          if (!result.success) {
            throw new Error(result.error || 'Sesion invalida')
          }

          // Backend devuelve: { success, message, id, name, email, role, branch, permissions, user: {...} }
          const userData = result.data.user || result.data

          // IMPORTANTE: Normalizar rol a minúsculas para coincidir con constantes ROLES
          const user = {
            id: userData.id,
            nombre: userData.name,
            email: userData.email,
            rol: userData.role?.toLowerCase() || '',
            telefono: userData.phone || '',
            activo: true,
            sedeId: userData.branchId || null,
            sedeName: userData.branch,
            permissions: userData.permissions
          }

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            sedeIdActiva: user.sedeId || null
          })

          return true
        } catch (error) {
          console.error('Error verificando sesion:', error)
          localStorage.removeItem('auth_token')

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message,
            sedeIdActiva: null
          })

          return false
        }
      },

      // Helpers
      hasPermission: (permission) => {
        const { user } = get()
        if (!user) return false

        const userPermissions = PERMISOS[user.rol] || {}
        return userPermissions[permission] === true
      },

      isRole: (role) => {
        const { user } = get()
        return user?.rol === role
      },

      isAdmin: () => {
        const { user } = get()
        return user?.rol === ROLES.ADMINISTRADOR
      },

      isCoordinador: () => {
        const { user } = get()
        return user?.rol === ROLES.COORDINADOR
      },

      isCliente: () => {
        const { user } = get()
        return user?.rol === ROLES.CLIENTE
      },

      isProduccion: () => {
        const { user } = get()
        return user?.rol === ROLES.PRODUCCION
      },

      // ============================================
      // HELPERS MULTI-SEDE
      // ============================================

      isSuperAdmin: () => {
        const { user } = get()
        return user?.rol === ROLES.SUPERADMINISTRADOR
      },

      /**
       * Obtiene el sedeId que se debe usar para filtrar datos
       * - SUPERADMINISTRADOR con sedeIdActiva: usa la sede seleccionada
       * - SUPERADMINISTRADOR sin sedeIdActiva (null): ve todas las sedes
       * - Usuarios internos: su sedeId asignado
       * - CLIENTE: null (no tiene sede)
       */
      getSedeIdParaFiltro: () => {
        const { user, sedeIdActiva } = get()
        if (!user) return null

        // Cliente no tiene sede
        if (user.rol === ROLES.CLIENTE) {
          return null
        }

        // SUPERADMINISTRADOR usa la sede activa (o null para ver todas)
        if (ROLES_MULTI_SEDE.includes(user.rol)) {
          return sedeIdActiva
        }

        // Usuarios internos usan su sede asignada
        return user.sedeId
      },

      /**
       * Verifica si el usuario puede ver datos de una sede específica
       * @param {number} sedeId - ID de la sede a verificar
       * @returns {boolean}
       */
      canAccessSede: (sedeId) => {
        const { user, sedeIdActiva } = get()
        if (!user) return false

        // SUPERADMINISTRADOR puede ver todas o la sede activa seleccionada
        if (ROLES_MULTI_SEDE.includes(user.rol)) {
          // Si no tiene sede activa seleccionada, puede ver todas
          if (sedeIdActiva === null) return true
          // Si tiene sede activa, solo ve esa
          return sedeIdActiva === sedeId
        }

        // Usuarios internos solo pueden ver su sede
        return user.sedeId === sedeId
      },

      /**
       * Verifica si el usuario puede ver datos de todas las sedes
       * (solo SUPERADMINISTRADOR sin sede activa seleccionada)
       */
      canViewAllSedes: () => {
        const { user, sedeIdActiva } = get()
        if (!user) return false

        return ROLES_MULTI_SEDE.includes(user.rol) && sedeIdActiva === null
      },

      /**
       * Verifica si el usuario es interno (tiene sede asignada o es SUPERADMIN)
       */
      isInternalUser: () => {
        const { user } = get()
        if (!user) return false
        return user.rol !== ROLES.CLIENTE
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sedeIdActiva: state.sedeIdActiva
      })
    }
  )
)

export default useAuthStore
