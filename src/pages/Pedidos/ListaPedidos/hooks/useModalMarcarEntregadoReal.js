import { useState } from 'react'
import OrdersService from '@services/OrdersService'

/**
 * Hook para gestión del modal de marcar como entregado con API real
 * Integrado con API-013 (Marcar pedido como entregado)
 */
export const useModalMarcarEntregadoReal = ({ pedidosExpandidos, refreshPedidos, showToast }) => {
  const [modalEntregado, setModalEntregado] = useState({
    isOpen: false,
    pedidoId: null,
    pedido: null
  })

  const [pagoFormData, setPagoFormData] = useState({
    tipoPago: 'contado',
    montoContado: 0,
    montoCredito: 0,
    diasCredito: 15
  })

  const [aceptarExcedente, setAceptarExcedente] = useState(false)
  const [loading, setLoading] = useState(false)

  const openModal = (pedidoId) => {
    const pedido = pedidosExpandidos.find(p => p.id === pedidoId)
    setModalEntregado({ isOpen: true, pedidoId, pedido })
    setAceptarExcedente(false)

    const diasCreditoCliente = pedido.cliente?.diasCredito || 15

    setPagoFormData({
      tipoPago: 'contado',
      montoContado: pedido?.totalMonto || 0,
      montoCredito: 0,
      diasCredito: diasCreditoCliente
    })
  }

  const closeModal = () => {
    setModalEntregado({ isOpen: false, pedidoId: null, pedido: null })
    setPagoFormData({
      tipoPago: 'contado',
      montoContado: 0,
      montoCredito: 0,
      diasCredito: 15
    })
    setAceptarExcedente(false)
    setLoading(false)
  }

  const handleChangeTipoPago = (tipo) => {
    const pedido = modalEntregado.pedido
    const diasCreditoCliente = pedido.cliente?.diasCredito || 15

    if (tipo === 'contado') {
      setPagoFormData({
        tipoPago: 'contado',
        montoContado: pedido.totalMonto,
        montoCredito: 0,
        diasCredito: diasCreditoCliente
      })
    } else if (tipo === 'credito') {
      setPagoFormData({
        tipoPago: 'credito',
        montoContado: 0,
        montoCredito: pedido.totalMonto,
        diasCredito: diasCreditoCliente
      })
    } else {
      setPagoFormData({
        tipoPago: 'mixto',
        montoContado: pedido.totalMonto / 2,
        montoCredito: pedido.totalMonto / 2,
        diasCredito: diasCreditoCliente
      })
    }
  }

  const handleChangeMontoContado = (valor) => {
    const contado = parseFloat(valor) || 0
    setPagoFormData({
      ...pagoFormData,
      montoContado: contado,
      montoCredito: pagoFormData.tipoPago === 'mixto'
        ? modalEntregado.pedido.totalMonto - contado
        : 0
    })
  }

  const handleChangeMontoCredito = (valor) => {
    const credito = parseFloat(valor) || 0
    setPagoFormData({
      ...pagoFormData,
      montoCredito: credito,
      montoContado: pagoFormData.tipoPago === 'mixto'
        ? modalEntregado.pedido.totalMonto - credito
        : 0
    })
  }

  const confirmarEntrega = async () => {
    const { tipoPago, montoContado, montoCredito, diasCredito } = pagoFormData
    const pedido = modalEntregado.pedido
    const cliente = pedido.cliente

    // Validar montos
    const totalPago = parseFloat(montoContado) + parseFloat(montoCredito)
    if (Math.abs(totalPago - pedido.totalMonto) > 0.01) {
      showToast(`El total debe ser ${pedido.totalMonto}. Actual: ${totalPago.toFixed(2)}`, 'error')
      return
    }

    try {
      setLoading(true)

      // Llamar a API-013 para marcar como entregado
      // Mapear tipo de pago frontend -> backend (contado -> CONTADO)
      const paymentTypeMap = {
        'contado': 'CONTADO',
        'credito': 'CREDITO',
        'mixto': 'MIXTO'
      }

      await OrdersService.deliverOrder(modalEntregado.pedidoId, {
        paymentType: paymentTypeMap[tipoPago],
        cashAmount: parseFloat(montoContado),
        creditAmount: parseFloat(montoCredito),
        creditDays: tipoPago !== 'contado' ? diasCredito : 0,
        acceptExceedLimit: aceptarExcedente
      })

      closeModal()
      showToast('Pedido marcado como entregado exitosamente', 'success')

      // Refrescar lista de pedidos
      if (refreshPedidos) {
        await refreshPedidos()
      }
    } catch (error) {
      console.error('Error marcando como entregado:', error)
      showToast(error.message || 'Error al marcar pedido como entregado', 'error')
    } finally {
      setLoading(false)
    }
  }

  return {
    modalEntregado,
    pagoFormData,
    aceptarExcedente,
    setAceptarExcedente,
    openModal,
    closeModal,
    handleChangeTipoPago,
    handleChangeMontoContado,
    handleChangeMontoCredito,
    confirmarEntrega,
    loading
  }
}
