import { useState, useMemo, useEffect } from 'react'
import { getLocalDate, getLocalDateTomorrow } from '@utils/dateUtils'

/**
 * Hook para gestión del método de entrega
 *
 * FLUJO DE ENTREGA:
 * 1. Si el pedido se crea ANTES de hora_limite → se asigna a la ruta del día (delivery por defecto)
 * 2. Si el pedido se crea DESPUÉS de hora_limite → el usuario debe elegir:
 *    - Recojo en Planta: pedido queda en S/R (sin ruta)
 *    - Express/Taxi: pedido queda en S/R (sin ruta), contactar por WhatsApp
 *    - Agendar para mañana: pedido se asigna a la ruta del día siguiente
 *
 * @param {Object} params
 * @param {boolean} params.rutaYaSalio - Si la ruta del cliente ya salió (hora actual > hora_limite)
 * @returns {Object} Estado y acciones del formulario de entrega
 */
export const useDeliveryForm = ({ rutaYaSalio = false } = {}) => {
  // Estados para método de entrega
  // Si la ruta NO ha salido, default es 'delivery' (para asignar automáticamente a ruta)
  // Si la ruta YA salió, default es 'taxi' (el usuario debe elegir otra opción)
  const [metodoEntrega, setMetodoEntrega] = useState(rutaYaSalio ? 'taxi' : 'delivery')
  const [metodoEntregaOtro, setMetodoEntregaOtro] = useState('')

  // Estado para agendar pedido para mañana (solo disponible si ruta ya salió)
  const [agendarManana, setAgendarManana] = useState(false)

  // Estado para observaciones
  const [observaciones, setObservaciones] = useState('')

  // Actualizar método de entrega cuando cambie rutaYaSalio
  // Si la ruta no ha salido → delivery (para asignar a ruta)
  // Si la ruta ya salió → taxi (usuario debe elegir)
  useEffect(() => {
    setMetodoEntrega(rutaYaSalio ? 'taxi' : 'delivery')
  }, [rutaYaSalio])

  // Cambiar método de entrega
  const cambiarMetodoEntrega = (nuevoMetodo) => {
    setMetodoEntrega(nuevoMetodo)
    if (nuevoMetodo !== 'otro') {
      setMetodoEntregaOtro('')
    }
    // Si cambia a 'agendar_manana', activar el flag
    if (nuevoMetodo === 'agendar_manana') {
      setAgendarManana(true)
    } else {
      setAgendarManana(false)
    }
  }

  // Obtener método de entrega final (mapeado a valores del backend: DELIVERY o RECOJO)
  const getMetodoEntregaFinal = () => {
    // Backend solo acepta 'DELIVERY' o 'RECOJO' (uppercase)
    // taxi y delivery se mapean a DELIVERY
    // recojo se mapea a RECOJO
    // otro se mapea a DELIVERY (por defecto es una entrega)
    // agendar_manana se mapea a DELIVERY (entrega programada para mañana)
    const metodoMap = {
      'taxi': 'DELIVERY',
      'delivery': 'DELIVERY',
      'recojo': 'RECOJO',
      'otro': 'DELIVERY',
      'agendar_manana': 'DELIVERY'
    }
    return metodoMap[metodoEntrega] || 'DELIVERY'
  }

  // Determinar si se debe asignar ruta automáticamente
  // Solo 'delivery' (Delivery Propio/Ruta) y 'agendar_manana' deben asignar ruta
  // taxi, recojo y otro NO deben asignar ruta
  const debeAsignarRuta = () => {
    return metodoEntrega === 'delivery' || metodoEntrega === 'agendar_manana'
  }

  // Obtener tipo de despacho para persistir en backend
  // Mapea el método de entrega interno al enum del backend: RUTA, TAXI, RECOJO, OTRO
  const getTipoDespacho = () => {
    const despachoMap = {
      'delivery': 'RUTA',
      'agendar_manana': 'RUTA',
      'taxi': 'TAXI',
      'recojo': 'RECOJO',
      'otro': 'OTRO'
    }
    return despachoMap[metodoEntrega] || 'RUTA'
  }

  // Obtener fecha de entrega basada en método seleccionado
  // Si es 'agendar_manana' → fecha de mañana
  // En cualquier otro caso → fecha de hoy
  // Usa funciones de dateUtils para evitar problemas de timezone
  const getFechaEntrega = () => {
    if (metodoEntrega === 'agendar_manana') {
      return getLocalDateTomorrow()
    }
    return getLocalDate()
  }

  // Verificar si el pedido será agendado para mañana
  const esPedidoAgendado = () => {
    return metodoEntrega === 'agendar_manana'
  }

  // Validar si el método de entrega es válido
  const isMetodoEntregaValido = () => {
    if (metodoEntrega === 'otro') {
      return metodoEntregaOtro.trim() !== ''
    }
    return true
  }

  return {
    // Estado
    metodoEntrega,
    metodoEntregaOtro,
    observaciones,
    agendarManana,

    // Acciones
    setMetodoEntrega: cambiarMetodoEntrega,
    setMetodoEntregaOtro,
    setObservaciones,
    setAgendarManana,

    // Helpers
    getMetodoEntregaFinal,
    isMetodoEntregaValido,
    debeAsignarRuta,
    getFechaEntrega,
    esPedidoAgendado,
    getTipoDespacho
  }
}
