import { useState } from 'react'
import { PedidoEditService } from '@services/PedidoEditService'

/**
 * Hook para gestión del modal de cancelar pedido
 */
export const useModalCancelar = ({ pedidosExpandidos, cancelPedido, showToast }) => {
  const [modalCancelar, setModalCancelar] = useState({
    isOpen: false,
    pedidoId: null,
    pedido: null,
    affectedModules: []
  })

  const openModal = (pedidoId) => {
    const pedido = pedidosExpandidos.find(p => p.id === pedidoId)
    const validation = PedidoEditService.canCancel(pedido)

    if (!validation.canCancel) {
      showToast(validation.reason, 'error')
      return
    }

    setModalCancelar({
      isOpen: true,
      pedidoId,
      pedido,
      affectedModules: validation.affectedModules
    })
  }

  const closeModal = () => {
    setModalCancelar({
      isOpen: false,
      pedidoId: null,
      pedido: null,
      affectedModules: []
    })
  }

  const confirmarCancelacion = async () => {
    const result = await cancelPedido(modalCancelar.pedidoId)

    if (result.success) {
      showToast('Pedido cancelado exitosamente. Se eliminó de producción y rutas.', 'success')
      closeModal()
    } else {
      showToast(result.error || 'Error al cancelar el pedido', 'error')
    }
  }

  return {
    modalCancelar,
    openModal,
    closeModal,
    confirmarCancelacion
  }
}
