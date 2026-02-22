import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '@services/AnnouncementsService'
import { CustomersService } from '@services/CustomersService'
import useAuthStore from '@features/auth/useAuthStore'
import { ROLES } from '@utils/constants'

/**
 * Hook para gestionar comunicados con integración real a API-027, API-028, API-029, API-030
 * Reemplaza useMockComunicados con llamadas reales al backend
 */
export const useAnnouncements = () => {
  const [comunicados, setComunicados] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useAuthStore()

  // Verificar si el usuario puede crear/editar comunicados
  const puedeGestionar = useMemo(() => {
    return user && (
      user.rol === ROLES.ADMINISTRADOR ||
      user.rol === ROLES.COORDINADOR ||
      user.rol === ROLES.SUPERADMINISTRADOR
    )
  }, [user])

  // Cargar comunicados desde API-027
  const cargarComunicados = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await listAnnouncements({ page: 1, pageSize: 100 })

      if (response.success && response.data) {
        // Mapear campos del backend al formato del frontend
        const comunicadosMapeados = response.data.map(item => ({
          id: item.id,
          titulo: item.title,
          mensaje: item.message,
          prioridad: item.priority,
          imagen: item.imageUrl || null,
          fechaCreacion: item.createdAt,
          creadorNombre: item.creatorName || 'Sistema',
          destinatarios: item.recipientIds || 'todos',
          activo: true
        }))

        setComunicados(comunicadosMapeados)
      }
    } catch (err) {
      console.error('Error cargando comunicados:', err)
      setError(err.message || 'Error al cargar comunicados')
      setComunicados([])
    } finally {
      setLoading(false)
    }
  }, [user])

  // Cargar comunicados al montar el componente
  useEffect(() => {
    cargarComunicados()
  }, [cargarComunicados])

  // Crear comunicado - API-028
  const crearComunicado = async (datosComunicado) => {
    if (!puedeGestionar) {
      return { success: false, error: 'No tienes permisos para crear comunicados' }
    }

    // Validar recipientIds
    let recipientIds = []
    if (Array.isArray(datosComunicado.destinatarios)) {
      recipientIds = datosComunicado.destinatarios
    } else if (datosComunicado.destinatarios === 'todos') {
      // Obtener todos los customer IDs activos
      try {
        const customersResponse = await CustomersService.listCustomers({ pageSize: 10000 })
        if (customersResponse.success && customersResponse.data.length > 0) {
          recipientIds = customersResponse.data.map(c => c.id)
        } else {
          return {
            success: false,
            error: 'No se encontraron clientes activos para enviar el comunicado'
          }
        }
      } catch (err) {
        console.error('Error obteniendo clientes:', err)
        return {
          success: false,
          error: 'Error al obtener lista de clientes'
        }
      }
    }

    if (recipientIds.length === 0) {
      return { success: false, error: 'Debes seleccionar al menos un destinatario' }
    }

    setLoading(true)
    try {
      // Mapear campos frontend a backend (con soporte para archivo de imagen)
      const payload = {
        title: datosComunicado.titulo,
        message: datosComunicado.mensaje,
        priority: datosComunicado.prioridad,
        recipientIds,
        imageFile: datosComunicado.imagenFile || null
      }

      const response = await createAnnouncement(payload)

      if (response.success) {
        await cargarComunicados()
        return { success: true }
      }

      return { success: false, error: 'Error al crear comunicado' }
    } catch (err) {
      console.error('Error creando comunicado:', err)
      return { success: false, error: err.message || 'Error al crear comunicado' }
    } finally {
      setLoading(false)
    }
  }

  // Actualizar comunicado - API-029
  const actualizarComunicado = async (id, datosActualizados) => {
    if (!puedeGestionar) {
      return { success: false, error: 'No tienes permisos para editar comunicados' }
    }

    setLoading(true)
    try {
      // Mapear campos frontend a backend (con soporte para archivo de imagen)
      const payload = {
        title: datosActualizados.titulo,
        message: datosActualizados.mensaje,
        priority: datosActualizados.prioridad,
        imageFile: datosActualizados.imagenFile || null,
        removeImage: datosActualizados.removeImage || false
      }

      const response = await updateAnnouncement(id, payload)

      if (response.success) {
        await cargarComunicados()
        return { success: true }
      }

      return { success: false, error: 'Error al actualizar comunicado' }
    } catch (err) {
      console.error('Error actualizando comunicado:', err)
      return { success: false, error: err.message || 'Error al actualizar comunicado' }
    } finally {
      setLoading(false)
    }
  }

  // Eliminar comunicado - API-030
  const eliminarComunicado = async (id) => {
    if (!puedeGestionar) {
      return { success: false, error: 'No tienes permisos para eliminar comunicados' }
    }

    setLoading(true)
    try {
      const response = await deleteAnnouncement(id)

      if (response.success) {
        // Recargar lista
        await cargarComunicados()
        return { success: true }
      }

      return { success: false, error: 'Error al eliminar comunicado' }
    } catch (err) {
      console.error('Error eliminando comunicado:', err)
      return { success: false, error: err.message || 'Error al eliminar comunicado' }
    } finally {
      setLoading(false)
    }
  }

  // Filtrar por prioridad
  const filtrarPorPrioridad = (prioridad) => {
    return comunicados.filter(c => c.prioridad === prioridad)
  }

  // Obtener comunicado por ID
  const getComunicadoById = (id) => {
    return comunicados.find(c => c.id === id)
  }

  return {
    comunicados,
    loading,
    error,
    puedeGestionar,
    crearComunicado,
    actualizarComunicado,
    eliminarComunicado,
    filtrarPorPrioridad,
    getComunicadoById,
    recargar: cargarComunicados
  }
}

export default useAnnouncements
