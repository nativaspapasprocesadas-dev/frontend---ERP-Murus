import { useState } from 'react'
import OrdersService, { getOrderById } from '@services/OrdersService'
import { PedidoEditService } from '@services/PedidoEditService'

/**
 * Hook para gestión del modal de editar pedido con API real
 * Integrado con API-010 (Actualizar pedido)
 */
export const useModalEditarPedidoReal = ({ pedidosExpandidos, refreshPedidos, showToast }) => {
  const [modalEditar, setModalEditar] = useState({
    isOpen: false,
    pedidoId: null,
    pedido: null,
    detallesEditados: []
  })
  const [loading, setLoading] = useState(false)

  const openModal = async (pedidoId) => {
    const pedidoBasico = pedidosExpandidos.find(p => p.id === pedidoId)
    const validation = PedidoEditService.canEdit(pedidoBasico)

    if (!validation.canEdit) {
      showToast(validation.reason, 'error')
      return
    }

    try {
      setLoading(true)

      // Cargar detalles completos del pedido desde la API
      const pedidoCompleto = await getOrderById(pedidoId)

      // Los detalles pueden venir como 'detalles' o 'detallesOriginales'
      const detalles = pedidoCompleto.detalles || pedidoCompleto.detallesOriginales || []

      setModalEditar({
        isOpen: true,
        pedidoId,
        pedido: pedidoCompleto,
        detallesEditados: detalles.map(d => ({
          ...d,
          cantidadOriginal: d.cantidad,
          // Asegurar que existan los campos necesarios para cálculos
          kilosPorBolsa: d.kilosPorBolsa || 0,
          precioUnitario: d.precioUnitario || 0,
          // precioKg se calcula a partir del precio por bolsa dividido por kilos
          precioKg: d.kilosPorBolsa > 0 ? (d.precioUnitario || 0) / d.kilosPorBolsa : 0,
          // El subtotal viene del backend o se calcula como cantidad * precio por bolsa
          subtotal: d.subtotal || (d.cantidad * (d.precioUnitario || 0))
        }))
      })
    } catch (error) {
      console.error('Error cargando detalles del pedido:', error)
      showToast('Error al cargar los detalles del pedido', 'error')
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setModalEditar({
      isOpen: false,
      pedidoId: null,
      pedido: null,
      detallesEditados: []
    })
    setLoading(false)
  }

  const handleChangeCantidad = (detalleId, nuevaCantidad) => {
    setModalEditar(prev => ({
      ...prev,
      detallesEditados: prev.detallesEditados.map(d =>
        d.id === detalleId
          ? {
              ...d,
              cantidad: parseInt(nuevaCantidad) || 0,
              // El subtotal es cantidad * precio por bolsa (precioUnitario)
              subtotal: (parseInt(nuevaCantidad) || 0) * (d.precioUnitario || 0)
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

    try {
      setLoading(true)

      // Preparar items para API-010
      // La API espera: items[].id, items[].quantity, items[].deleted
      const items = []

      // Marcar items editados o sin cambios
      detallesEditados.forEach(detalle => {
        items.push({
          id: detalle.id,
          quantity: detalle.cantidad,
          deleted: false
        })
      })

      // Marcar items eliminados
      const detallesOriginales = pedido.detalles || pedido.detallesOriginales || []
      const detallesEliminados = detallesOriginales.filter(
        original => !detallesEditados.find(editado => editado.id === original.id)
      )
      detallesEliminados.forEach(detalle => {
        items.push({
          id: detalle.id,
          quantity: 0,
          deleted: true
        })
      })

      // Llamar a API-010 para actualizar pedido
      await OrdersService.updateOrder(pedidoId, { items })

      closeModal()
      showToast('Pedido actualizado exitosamente', 'success')

      // Refrescar lista de pedidos
      if (refreshPedidos) {
        await refreshPedidos()
      }
    } catch (error) {
      console.error('Error actualizando pedido:', error)
      showToast(error.message || 'Error al actualizar pedido', 'error')
    } finally {
      setLoading(false)
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
    confirmarEdicion,
    loading
  }
}
