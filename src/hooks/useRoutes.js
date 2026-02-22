/**
 * Hook useRoutes - Gestión de rutas con API real
 * Reemplaza a useMockRutas
 * Integrado con API-036, API-037, API-038, API-039, API-040, API-041, API-042, API-043
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import RoutesService from '@services/RoutesService'
import useAuthStore from '@features/auth/useAuthStore'
import { ESTADOS_RUTA, ROLES } from '@utils/constants'
import { getLocalDate } from '@utils/dateUtils'

/**
 * Mapeo de estados del backend a estados del frontend
 * Backend usa: 'pendiente', 'en_curso', 'completada', 'cancelada'
 * Frontend usa: 'abierta', 'enviada', 'completada' (ESTADOS_RUTA)
 */
const ESTADO_BACKEND_TO_FRONTEND = {
  'pendiente': ESTADOS_RUTA.ABIERTA,      // pendiente -> abierta
  'en_curso': ESTADOS_RUTA.ENVIADA,       // en_curso -> enviada
  'completada': ESTADOS_RUTA.COMPLETADA,  // completada -> completada
  'cancelada': 'cancelada'                 // cancelada se mantiene
}

/**
 * Normaliza el estado del backend al formato del frontend
 */
const normalizeStatus = (backendStatus) => {
  if (!backendStatus) return ESTADOS_RUTA.ABIERTA
  const status = backendStatus.toLowerCase()
  return ESTADO_BACKEND_TO_FRONTEND[status] || status
}

export const useRoutes = () => {
  const [routes, setRoutes] = useState([])
  const [routeConfigs, setRouteConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [historialLimit, setHistorialLimit] = useState(20) // Paginación configurable

  const { user, isRole } = useAuthStore()
  const isSuperAdmin = isRole(ROLES.SUPERADMINISTRADOR)

  /**
   * Cargar rutas desde API
   * Solo disponible para SUPERADMINISTRADOR, ADMINISTRADOR, COORDINADOR
   * Incluye historial de los últimos 60 días
   */
  const loadRoutes = useCallback(async (filters = {}) => {
    // Solo cargar rutas si el usuario tiene permisos
    const canAccessRoutes = isRole(ROLES.SUPERADMINISTRADOR) ||
                            isRole(ROLES.ADMINISTRADOR) ||
                            isRole(ROLES.COORDINADOR)

    if (!canAccessRoutes) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await RoutesService.listRoutes({
        pageSize: 100,
        includeHistory: true, // Incluir historial de rutas
        ...filters
      })

      setRoutes(response.data || [])
    } catch (err) {
      // Silenciar error de permisos - es esperado para roles sin acceso
      if (!err.message?.includes('permisos')) {
        console.error('Error cargando rutas:', err)
        setError(err.message || 'Error al cargar rutas')
      }
    } finally {
      setLoading(false)
    }
  }, [isRole])

  /**
   * Cargar configuraciones de rutas
   */
  const loadRouteConfigs = useCallback(async () => {
    try {
      const response = await RoutesService.listRouteConfigs()
      setRouteConfigs(response.data || [])
    } catch (err) {
      console.error('Error cargando configuraciones de rutas:', err)
    }
  }, [])

  // Cargar rutas y configs al montar
  useEffect(() => {
    loadRoutes()
    loadRouteConfigs()
  }, [loadRoutes, loadRouteConfigs])

  /**
   * Mapear rutas (API backend) -> rutas (frontend español) para compatibilidad
   * Enriquecer con hora límite de recepción de la configuración
   * Normaliza estados: backend ('pendiente', 'en_curso') -> frontend ('abierta', 'enviada')
   */
  const rutas = useMemo(() => {
    return routes.map(r => {
      // Buscar la configuración de esta ruta para obtener horaLimiteRecepcion
      const rutaConfig = routeConfigs.find(rc => rc.id === r.routeConfigId)

      return {
        id: r.id,
        numero: r.routeConfigId || r.id,
        nombre: r.name,
        fecha: r.date,
        estado: normalizeStatus(r.status), // Normalizado a estados del frontend
        estadoOriginal: r.status, // Mantener el estado original para debugging
        sedeId: r.branchId,
        sedeName: rutaConfig?.sedeName || r.branchName || null,
        choferId: r.driverId,
        driver: r.driver, // Objeto completo del chofer desde el backend
        cantidadPedidos: r.orderCount || 0,
        totalKilos: r.totalKilos || r.totalKg || 0,
        totalMonto: r.totalAmount || 0,
        fechaEnvio: r.dispatchedAt,
        fechaCompletada: r.completedAt,
        fechaCreacion: r.createdAt,
        fechaActualizacion: r.updatedAt,
        horaLimiteRecepcion: rutaConfig?.horaLimiteRecepcion || null
      }
    })
  }, [routes, routeConfigs])

  /**
   * Rutas del día actual (usa getLocalDate para evitar problemas de timezone)
   */
  const rutasHoy = useMemo(() => {
    const hoy = getLocalDate()
    return rutas.filter((r) => r.fecha && r.fecha.startsWith(hoy))
  }, [rutas])

  /**
   * Rutas abiertas (pendientes)
   * Estados normalizados a ESTADOS_RUTA.ABIERTA
   */
  const rutasAbiertas = useMemo(() => {
    return rutas.filter((r) => r.estado === ESTADOS_RUTA.ABIERTA)
  }, [rutas])

  /**
   * Rutas enviadas (en curso)
   * Estados normalizados a ESTADOS_RUTA.ENVIADA
   */
  const rutasEnviadas = useMemo(() => {
    return rutas.filter((r) => r.estado === ESTADOS_RUTA.ENVIADA)
  }, [rutas])

  /**
   * Rutas completadas
   * Estados normalizados a ESTADOS_RUTA.COMPLETADA
   */
  const rutasCompletadas = useMemo(() => {
    return rutas.filter((r) => r.estado === ESTADOS_RUTA.COMPLETADA)
  }, [rutas])

  /**
   * Rutas programadas para fechas futuras (después de hoy)
   * Útil para ver pedidos agendados para próximos días
   */
  const rutasFuturas = useMemo(() => {
    const hoy = getLocalDate()
    return rutas
      .filter((r) => r.fecha && r.fecha > hoy)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha)) // Ordenar por fecha ascendente (próximas primero)
  }, [rutas])

  /**
   * Historial de rutas (solo rutas PASADAS, anteriores a hoy)
   * Con paginación configurable via setHistorialLimit
   */
  const rutasHistorial = useMemo(() => {
    const hoy = getLocalDate()
    return rutas
      .filter((r) => r.fecha && r.fecha < hoy)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)) // Ordenar por fecha descendente
      .slice(0, historialLimit)
  }, [rutas, historialLimit])

  /**
   * Cargar más rutas en el historial
   */
  const loadMoreHistorial = useCallback((increment = 20) => {
    setHistorialLimit(prev => prev + increment)
  }, [])

  /**
   * Obtener ruta por ID
   */
  const getRutaById = useCallback((id) => {
    return rutas.find(r => r.id === Number(id))
  }, [rutas])

  /**
   * Actualizar ruta (dispatch o complete)
   */
  const update = useCallback(async (rutaId, updates) => {
    try {
      // Si el update incluye estado ENVIADA, usar dispatchRoute
      if (updates.estado === ESTADOS_RUTA.ENVIADA || updates.estado === 'IN_TRANSIT') {
        if (!updates.choferId) {
          throw new Error('Debe asignar un chofer antes de enviar la ruta')
        }
        await RoutesService.dispatchRoute(rutaId, updates.choferId)
      }
      // Si el update incluye estado COMPLETADA, usar completeRoute
      else if (updates.estado === ESTADOS_RUTA.COMPLETADA || updates.estado === 'COMPLETED') {
        await RoutesService.completeRoute(rutaId)
      }
      // Si el update incluye estado ABIERTA (reabrir), usar reopenRoute
      else if (updates.estado === ESTADOS_RUTA.ABIERTA) {
        await RoutesService.reopenRoute(rutaId)
      }

      // Recargar rutas después de actualizar
      await loadRoutes()

      return { success: true }
    } catch (err) {
      console.error('Error actualizando ruta:', err)
      throw err
    }
  }, [loadRoutes])

  /**
   * Configuraciones de rutas mapeadas
   */
  const rutasConfig = useMemo(() => {
    return routeConfigs.map(rc => ({
      id: rc.id,
      numero: rc.order || rc.id,
      nombre: rc.name,
      color: rc.color,
      descripcion: rc.description,
      activo: rc.isActive,
      sedeId: rc.branchId,
      sedeName: rc.branchName,
      horaLimiteRecepcion: rc.horaLimiteRecepcion,
      fechaCreacion: rc.createdAt,
      fechaActualizacion: rc.updatedAt
    }))
  }, [routeConfigs])

  /**
   * Colores por ID de ruta (para lookup desde routeId/routeConfigId)
   */
  const coloresPorNumero = useMemo(() => {
    const colores = {}
    rutasConfig.forEach(rc => {
      colores[rc.id] = rc.color || '#6366f1'
    })
    return colores
  }, [rutasConfig])

  /**
   * Nombres por ID de ruta (para lookup desde routeId/routeConfigId)
   */
  const nombresPorNumero = useMemo(() => {
    const nombres = {}
    rutasConfig.forEach(rc => {
      nombres[rc.id] = rc.nombre || `Ruta ${rc.id}`
    })
    return nombres
  }, [rutasConfig])

  /**
   * Rutas activas
   */
  const rutasActivas = useMemo(() => {
    return rutasConfig.filter(rc => rc.activo)
  }, [rutasConfig])

  /**
   * Crear configuración de ruta
   */
  const createRutaConfig = useCallback(async (configData) => {
    try {
      const payload = {
        name: configData.nombre,
        color: configData.color,
        description: configData.descripcion
      }

      // Incluir hora límite de recepción si se proporciona
      if (configData.horaLimiteRecepcion) {
        payload.horaLimiteRecepcion = configData.horaLimiteRecepcion
      }

      // Si es SUPERADMIN y proporciona sedeId, incluirlo en el payload
      if (isSuperAdmin && configData.sedeId) {
        const branchIdValue = parseInt(configData.sedeId)
        if (!isNaN(branchIdValue) && branchIdValue > 0) {
          payload.branchId = branchIdValue
        }
      }

      const response = await RoutesService.createRouteConfig(payload)

      if (response.success) {
        await loadRouteConfigs()
        return { success: true, id: response.id }
      }

      return { success: false, error: response.error || 'Error desconocido' }
    } catch (err) {
      console.error('Error creando configuración de ruta:', err)
      return { success: false, error: err.message || 'Error al crear configuración' }
    }
  }, [loadRouteConfigs, isSuperAdmin])

  /**
   * Actualizar configuración de ruta
   */
  const updateRutaConfig = useCallback(async (id, configData) => {
    try {
      const payload = {
        name: configData.nombre,
        color: configData.color,
        description: configData.descripcion
      }

      // Incluir número de ruta (orden) si se proporciona
      if (configData.numero !== undefined) {
        payload.order = configData.numero
      }

      // Incluir hora límite de recepción si se proporciona
      if (configData.horaLimiteRecepcion !== undefined) {
        payload.horaLimiteRecepcion = configData.horaLimiteRecepcion
      }

      const response = await RoutesService.updateRouteConfig(id, payload)

      if (response.success) {
        await loadRouteConfigs()
        return { success: true }
      }

      return { success: false, error: response.error || 'Error desconocido' }
    } catch (err) {
      console.error('Error actualizando configuración de ruta:', err)
      return { success: false, error: err.message || 'Error al actualizar configuración' }
    }
  }, [loadRouteConfigs])

  /**
   * Desactivar configuración de ruta
   */
  const desactivarRuta = useCallback(async (id) => {
    try {
      const response = await RoutesService.updateRouteConfig(id, { isActive: false })

      if (response.success) {
        await loadRouteConfigs()
        return { success: true }
      }

      return { success: false, error: response.error || 'Error desconocido' }
    } catch (err) {
      console.error('Error desactivando ruta:', err)
      return { success: false, error: err.message || 'Error al desactivar ruta' }
    }
  }, [loadRouteConfigs])

  /**
   * Activar configuración de ruta
   */
  const activarRuta = useCallback(async (id) => {
    try {
      const response = await RoutesService.updateRouteConfig(id, { isActive: true })

      if (response.success) {
        await loadRouteConfigs()
        return { success: true }
      }

      return { success: false, error: response.error || 'Error desconocido' }
    } catch (err) {
      console.error('Error activando ruta:', err)
      return { success: false, error: err.message || 'Error al activar ruta' }
    }
  }, [loadRouteConfigs])

  return {
    // Arrays - mapeados a español para compatibilidad
    rutas,
    rutasExpandidas: rutas, // Alias para compatibilidad con código existente
    rutasHoy,
    rutasFuturas, // Rutas programadas para fechas futuras
    rutasAbiertas,
    rutasEnviadas,
    rutasCompletadas,
    rutasHistorial,
    routes, // API real (datos originales)

    // Configuraciones
    rutasConfig,
    rutasActivas,
    coloresPorNumero,
    nombresPorNumero,

    // Estados
    loading,
    error,
    historialLimit,

    // Métodos
    getRutaById,
    update,
    loadRoutes,
    loadRouteConfigs,
    createRutaConfig,
    updateRutaConfig,
    desactivarRuta,
    activarRuta,
    loadMoreHistorial,
    setHistorialLimit,
  }
}

export default useRoutes
