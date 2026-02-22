import { useState, useEffect, useCallback } from 'react'
import {
  getUnreadAnnouncements,
  markAnnouncementAsRead
} from '@services/AnnouncementsService'
import useAuthStore from '@features/auth/useAuthStore'

/**
 * Hook para gestionar comunicados no leídos (API-005, API-031)
 * Usado principalmente en Dashboard para mostrar modal automático con comunicados pendientes
 *
 * INTEGRACIÓN ELM-083:
 * - API-005 GET /api/v1/announcements/unread: obtiene comunicados no leídos
 * - API-031 POST /api/v1/announcements/:id/read: marca comunicado como leído
 */
export const useUnreadAnnouncements = () => {
  const [comunicadosNoLeidos, setComunicadosNoLeidos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useAuthStore()

  // Cargar comunicados no leídos - API-005
  const cargarComunicadosNoLeidos = useCallback(async () => {
    if (!user) {
      setComunicadosNoLeidos([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await getUnreadAnnouncements()

      if (response.success && response.data) {
        // Mapear campos del backend (inglés) al frontend (español)
        const comunicadosMapeados = response.data.map(item => ({
          id: item.id,
          titulo: item.title,
          mensaje: item.message,
          prioridad: item.priority,
          imagen: item.imageUrl || null,
          fechaCreacion: item.createdAt
        }))

        setComunicadosNoLeidos(comunicadosMapeados)
      } else {
        setComunicadosNoLeidos([])
      }
    } catch (err) {
      console.error('Error cargando comunicados no leídos:', err)
      setError(err.message || 'Error al cargar comunicados')
      setComunicadosNoLeidos([])
    } finally {
      setLoading(false)
    }
  }, [user])

  // Marcar comunicado como leído - API-031
  const marcarComoLeido = async (id) => {
    try {
      const response = await markAnnouncementAsRead(id)

      if (response.success) {
        // Remover de la lista local
        setComunicadosNoLeidos(prev => prev.filter(c => c.id !== id))
        return { success: true }
      }

      return { success: false, error: 'Error al marcar como leído' }
    } catch (err) {
      console.error('Error marcando comunicado como leído:', err)
      return { success: false, error: err.message || 'Error al marcar como leído' }
    }
  }

  // Cargar al montar y cuando cambie el usuario
  useEffect(() => {
    cargarComunicadosNoLeidos()
  }, [cargarComunicadosNoLeidos])

  return {
    comunicadosNoLeidos,
    loading,
    error,
    tieneComunicadosNoLeidos: comunicadosNoLeidos.length > 0,
    marcarComoLeido,
    recargar: cargarComunicadosNoLeidos
  }
}

export default useUnreadAnnouncements
