import { useState, useEffect } from 'react'
import { getLocalDateTime } from '@utils/dateUtils'

/**
 * Hook para gestionar notificaciones de recordatorios de pago
 * Las notificaciones se guardan en localStorage y se muestran al cliente
 */
export const useNotificaciones = (usuarioId) => {
  const [notificaciones, setNotificaciones] = useState([])
  const STORAGE_KEY = 'notificaciones_recordatorios'

  // Cargar notificaciones del localStorage
  useEffect(() => {
    if (!usuarioId) return

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const allNotificaciones = JSON.parse(stored)
        // Filtrar solo las notificaciones del usuario actual
        const misNotificaciones = allNotificaciones.filter(
          (n) => n.usuarioId === usuarioId && !n.leida
        )
        setNotificaciones(misNotificaciones)
      } catch (error) {
        console.error('Error al cargar notificaciones:', error)
      }
    }
  }, [usuarioId])

  // Crear nueva notificación de recordatorio
  const crearRecordatorio = (clienteId, usuarioId, mensaje, datos = {}) => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const allNotificaciones = stored ? JSON.parse(stored) : []

    const nuevaNotificacion = {
      id: Date.now(),
      tipo: 'recordatorio_pago',
      clienteId,
      usuarioId,
      mensaje,
      datos,
      fechaCreacion: getLocalDateTime(),
      leida: false
    }

    allNotificaciones.push(nuevaNotificacion)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotificaciones))

    return nuevaNotificacion
  }

  // Marcar notificación como leída
  const marcarComoLeida = (notificacionId) => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return

    const allNotificaciones = JSON.parse(stored)
    const updated = allNotificaciones.map((n) =>
      n.id === notificacionId ? { ...n, leida: true } : n
    )

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    // Actualizar estado local
    setNotificaciones((prev) => prev.filter((n) => n.id !== notificacionId))
  }

  // Marcar todas como leídas
  const marcarTodasComoLeidas = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return

    const allNotificaciones = JSON.parse(stored)
    const updated = allNotificaciones.map((n) =>
      n.usuarioId === usuarioId ? { ...n, leida: true } : n
    )

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setNotificaciones([])
  }

  return {
    notificaciones,
    crearRecordatorio,
    marcarComoLeida,
    marcarTodasComoLeidas,
    tieneNotificaciones: notificaciones.length > 0
  }
}

