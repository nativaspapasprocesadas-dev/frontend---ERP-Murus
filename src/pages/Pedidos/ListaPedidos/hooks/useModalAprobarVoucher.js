import { useState } from 'react'
import { approvePayment } from '@services/OrdersService'

/**
 * Hook para gestion del modal de aprobacion de voucher de pago
 * Permite aprobar o rechazar vouchers de pedidos con pago pendiente
 */
export const useModalAprobarVoucher = ({ pedidosExpandidos, refreshPedidos, showToast }) => {
  const [modalVoucher, setModalVoucher] = useState({
    isOpen: false,
    pedidoId: null,
    pedido: null
  })
  const [loading, setLoading] = useState(false)

  const openModal = (pedidoId) => {
    const pedido = pedidosExpandidos.find(p => p.id === pedidoId)

    if (!pedido) {
      showToast('No se encontro el pedido', 'error')
      return
    }

    if (!pedido.voucherUrl) {
      showToast('Este pedido no tiene voucher adjunto', 'warning')
      return
    }

    setModalVoucher({
      isOpen: true,
      pedidoId,
      pedido
    })
  }

  const closeModal = () => {
    setModalVoucher({
      isOpen: false,
      pedidoId: null,
      pedido: null
    })
  }

  const handleAprobar = async (pedidoId) => {
    setLoading(true)
    try {
      const result = await approvePayment(pedidoId, 'APROBADO')

      if (result.success) {
        showToast('Pago aprobado exitosamente', 'success')
        closeModal()
        // Refrescar la lista de pedidos
        if (refreshPedidos) {
          refreshPedidos()
        }
      }
    } catch (error) {
      showToast(error.message || 'Error al aprobar el pago', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRechazar = async (pedidoId, observaciones) => {
    if (!observaciones || observaciones.trim().length < 5) {
      showToast('El motivo del rechazo debe tener al menos 5 caracteres', 'error')
      return
    }

    setLoading(true)
    try {
      const result = await approvePayment(pedidoId, 'RECHAZADO', observaciones)

      if (result.success) {
        showToast('Pago rechazado. Se notificara al cliente.', 'warning')
        closeModal()
        // Refrescar la lista de pedidos
        if (refreshPedidos) {
          refreshPedidos()
        }
      }
    } catch (error) {
      showToast(error.message || 'Error al rechazar el pago', 'error')
    } finally {
      setLoading(false)
    }
  }

  return {
    modalVoucher,
    loading,
    openModal,
    closeModal,
    handleAprobar,
    handleRechazar
  }
}
