import { useState, useEffect } from 'react'
import { TIPOS_PAGO, TIPO_CLIENTE } from '@utils/constants'

/**
 * Hook para gestión del formulario de tipo de pago
 * Determina automaticamente el tipo de pago segun el tipo de cliente:
 * - Cliente RECURRENTE: SIEMPRE Crédito (automático, se carga a su cuenta)
 * - Cliente NO_RECURRENTE: siempre Contado (requiere voucher)
 *
 * @param {Object} cliente - Cliente seleccionado
 * @returns {Object} Estado y acciones del formulario de pago
 */
export const usePaymentForm = ({ cliente } = {}) => {
  // Estado para tipo de pago
  const [tipoPagoSeleccionado, setTipoPagoSeleccionado] = useState(TIPOS_PAGO.CONTADO)

  // Estado para días de crédito personalizados
  const [diasCreditoPersonalizados, setDiasCreditoPersonalizados] = useState(null)

  // Estado para pago anticipado
  const [pagadoAnticipado, setPagadoAnticipado] = useState(false)

  // Determinar si el cliente es recurrente (crédito automático)
  const esClienteRecurrente = cliente?.tipoCliente === TIPO_CLIENTE.RECURRENTE
  const esClienteNoRecurrente = cliente?.tipoCliente === TIPO_CLIENTE.NO_RECURRENTE

  // Actualizar tipo de pago y días de crédito cuando cambia el cliente
  useEffect(() => {
    if (cliente) {
      // Cliente RECURRENTE: FORZAR CREDITO (todos los pedidos van a crédito automáticamente)
      if (cliente.tipoCliente === TIPO_CLIENTE.RECURRENTE) {
        setTipoPagoSeleccionado(TIPOS_PAGO.CREDITO)
        setPagadoAnticipado(false)
      }
      // Cliente NO_RECURRENTE: forzar CONTADO
      else if (cliente.tipoCliente === TIPO_CLIENTE.NO_RECURRENTE) {
        setTipoPagoSeleccionado(TIPOS_PAGO.CONTADO)
        setPagadoAnticipado(false) // No anticipado, requiere voucher
      }
      setDiasCreditoPersonalizados(cliente.diasCredito || 15)
    }
  }, [cliente])

  // Resetear pago anticipado cuando cambia a crédito
  useEffect(() => {
    if (tipoPagoSeleccionado === TIPOS_PAGO.CREDITO) {
      setPagadoAnticipado(false)
    }
  }, [tipoPagoSeleccionado])

  // Wrapper para setTipoPagoSeleccionado que respeta restricciones de cliente
  const handleSetTipoPago = (tipo) => {
    // Cliente RECURRENTE: siempre CREDITO, no se puede cambiar
    if (esClienteRecurrente) {
      return // Ignorar, el crédito es automático
    }
    // Cliente NO_RECURRENTE no puede cambiar a credito
    if (esClienteNoRecurrente && tipo === TIPOS_PAGO.CREDITO) {
      return // Ignorar intento de cambiar a credito
    }
    setTipoPagoSeleccionado(tipo)
  }

  // Obtener días de crédito finales
  const getDiasCreditoFinal = () => {
    if (tipoPagoSeleccionado === TIPOS_PAGO.CREDITO) {
      return diasCreditoPersonalizados || cliente?.diasCredito || 15
    }
    return null
  }

  // Calcular fecha de vencimiento
  const getFechaVencimiento = () => {
    const dias = diasCreditoPersonalizados || 15
    const fecha = new Date()
    fecha.setDate(fecha.getDate() + dias)
    return fecha
  }

  return {
    // Estado
    tipoPagoSeleccionado,
    diasCreditoPersonalizados,
    pagadoAnticipado,

    // Flags de tipo de cliente
    esClienteRecurrente,
    esClienteNoRecurrente,
    puedeUsarCredito: esClienteRecurrente,

    // Acciones
    setTipoPagoSeleccionado: handleSetTipoPago, // Usa el wrapper con validacion
    setDiasCreditoPersonalizados,
    setPagadoAnticipado,

    // Helpers
    getDiasCreditoFinal,
    getFechaVencimiento
  }
}
