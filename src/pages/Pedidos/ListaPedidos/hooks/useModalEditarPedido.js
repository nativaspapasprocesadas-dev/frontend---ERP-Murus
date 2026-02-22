import { useState } from 'react'
import { PedidoEditService } from '@services/PedidoEditService'

/**
 * Hook para gestión del modal de editar pedido
 * INTEGRADO: Usa API-010 PUT /api/v1/orders/:id via update de usePedidosData
 * ELIMINADO: useMockDetallePedidos
 */
export const useModalEditarPedido = ({ pedidosExpandidos, update, showToast }) => {

  const [modalEditar, setModalEditar] = useState({
    isOpen: false,
    pedidoId: null,
    pedido: null,
    detallesEditados: []
  })

  const openModal = (pedidoId) => {
    const pedido = pedidosExpandidos.find(p => p.id === pedidoId)
    const validation = PedidoEditService.canEdit(pedido)

    if (!validation.canEdit) {
      showToast(validation.reason, 'error')
      return
    }

    setModalEditar({
      isOpen: true,
      pedidoId,
      pedido,
      detallesEditados: pedido.detalles.map(d => ({
        ...d,
        cantidadOriginal: d.cantidad
      }))
    })
  }

  const closeModal = () => {
    setModalEditar({
      isOpen: false,
      pedidoId: null,
      pedido: null,
      detallesEditados: []
    })
  }

  const handleChangeCantidad = (detalleId, nuevaCantidad) => {
    setModalEditar(prev => ({
      ...prev,
      detallesEditados: prev.detallesEditados.map(d =>
        d.id === detalleId
          ? {
              ...d,
              cantidad: parseInt(nuevaCantidad) || 0,
              subtotal: (parseInt(nuevaCantidad) || 0) * d.kilosPorBolsa * d.precioKg
            }
          : d
      )
    }))
  }

  const handleEliminarDetalle = (detalleId) => {
    setModalEditar(prev => ({
      ...prev,
      detallesEditados: prev.detallesEditados.filter(d => d.id !== detalleId)
    }))
  }

  const confirmarEdicion = async () => {
    const { pedidoId, detallesEditados, pedido } = modalEditar

    // Validar que haya al menos un producto
    if (detallesEditados.length === 0) {
      showToast('El pedido debe tener al menos un producto', 'error')
      return
    }

    // Validar que todas las cantidades sean válidas
    const cantidadesInvalidas = detallesEditados.filter(d => d.cantidad <= 0)
    if (cantidadesInvalidas.length > 0) {
      showToast('Las cantidades deben ser mayores a 0', 'error')
      return
    }

    // Construir payload para API-010
    // Mapear items editados con cantidad actualizada
    const itemsActualizados = detallesEditados.map(detalle => ({
      id: detalle.id,
      quantity: detalle.cantidad
    }))

    // Marcar como eliminados los items que ya no están en la lista editada
    const detallesOriginales = pedido.detalles || []
    const detallesEliminados = detallesOriginales
      .filter(original => !detallesEditados.find(editado => editado.id === original.id))
      .map(detalle => ({
        id: detalle.id,
        deleted: true
      }))

    // Combinar items actualizados y eliminados
    const items = [...itemsActualizados, ...detallesEliminados]

    // Llamar a API-010 PUT /api/v1/orders/:id
    const result = await update(pedidoId, { items })

    if (result.success) {
      showToast('Pedido actualizado exitosamente', 'success')
      closeModal()
    } else {
      showToast(result.error || 'Error al actualizar el pedido', 'error')
    }
  }

  // Calcular totales editados
  const totalesEditados = {
    kilos: modalEditar.detallesEditados.reduce(
      (sum, d) => sum + (d.cantidad * d.kilosPorBolsa), 0
    ),
    monto: modalEditar.detallesEditados.reduce(
      (sum, d) => sum + d.subtotal, 0
    )
  }

  return {
    modalEditar,
    totalesEditados,
    openModal,
    closeModal,
    handleChangeCantidad,
    handleEliminarDetalle,
    confirmarEdicion
  }
}
