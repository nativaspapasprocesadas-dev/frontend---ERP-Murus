import { useMemo } from 'react'
import { useRoutes } from '@hooks/useRoutes'

/**
 * Hook para obtener información sobre horarios límite de una ruta
 * Integrado con API-040 (GET /api/v1/routes/config)
 * @param {number} numeroRuta - Número de ruta (1, 2, 3)
 * @returns {object} - Configuración de ruta y estado del horario
 */
export const useHorarioRuta = (numeroRuta) => {
  const { rutasActivas } = useRoutes()

  const rutaConfig = useMemo(() => {
    return rutasActivas.find(r => r.numero === numeroRuta)
  }, [rutasActivas, numeroRuta])

  const estadoHorario = useMemo(() => {
    if (!rutaConfig || !rutaConfig.horaLimiteRecepcion) {
      return {
        mostrarBanner: false,
        estado: 'desconocido',
        tipo: 'info',
        mensaje: ''
      }
    }

    const ahora = new Date()
    const horaActual = ahora.getHours()
    const minutosActuales = ahora.getMinutes()
    const horaActualEnMinutos = horaActual * 60 + minutosActuales

    // Parsear hora límite (formato "HH:MM")
    const [horaLimite, minutosLimite] = rutaConfig.horaLimiteRecepcion.split(':').map(Number)
    const horaLimiteEnMinutos = horaLimite * 60 + minutosLimite

    // Calcular minutos restantes
    const minutosRestantes = horaLimiteEnMinutos - horaActualEnMinutos

    // Si ya pasó la hora límite
    if (minutosRestantes <= 0) {
      return {
        mostrarBanner: true,
        estado: 'fuera-de-horario',
        tipo: 'danger',
        mensaje: `El horario para realizar pedidos de esta ruta es hasta las ${rutaConfig.horaLimiteRecepcion} horas. Comuníquese con administración para realizar un pedido.`,
        puedeHacerPedido: false
      }
    }

    // Si faltan menos de 60 minutos
    if (minutosRestantes <= 60) {
      const horas = Math.floor(minutosRestantes / 60)
      const minutos = minutosRestantes % 60

      let tiempoTexto = ''
      if (horas > 0) {
        tiempoTexto = `${horas} hora${horas > 1 ? 's' : ''}`
        if (minutos > 0) {
          tiempoTexto += ` y ${minutos} minuto${minutos > 1 ? 's' : ''}`
        }
      } else {
        tiempoTexto = `${minutos} minuto${minutos > 1 ? 's' : ''}`
      }

      return {
        mostrarBanner: true,
        estado: 'proximo-a-cerrar',
        tipo: 'warning',
        mensaje: `Recuerda hacer tu pedido antes de las ${rutaConfig.horaLimiteRecepcion} horas. Solo faltan ${tiempoTexto}.`,
        tiempoRestante: minutosRestantes,
        puedeHacerPedido: true
      }
    }

    // Si está en horario normal (más de 60 minutos restantes) - NO mostrar banner
    return {
      mostrarBanner: false,
      estado: 'abierto',
      tipo: 'info',
      mensaje: '',
      puedeHacerPedido: true
    }
  }, [rutaConfig])

  return {
    rutaConfig,
    estadoHorario,
    puedeHacerPedido: estadoHorario.puedeHacerPedido !== false
  }
}
