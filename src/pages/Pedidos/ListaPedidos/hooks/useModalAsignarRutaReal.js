import { useState } from 'react'
import OrdersService from '@services/OrdersService'

/**
 * Hook para gestión del modal de asignar ruta con API real
 * Integrado con API-012 (Asignar pedido a ruta)
 */
export const useModalAsignarRutaReal = ({ refreshPedidos, showToast }) => {
  const [modalAsignarRuta, setModalAsignarRuta] = useState({
    isOpen: false,
    pedidoId: null
  })
  const [rutaSeleccionada, setRutaSeleccionada] = useState('')
  const [loading, setLoading] = useState(false)

  const openModal = (pedidoId) => {
    setModalAsignarRuta({ isOpen: true, pedidoId })
    setRutaSeleccionada('')
  }

  const closeModal = () => {
    setModalAsignarRuta({ isOpen: false, pedidoId: null })
    setRutaSeleccionada('')
    setLoading(false)
  }

  const confirmarAsignacion = async () => {
    if (!rutaSeleccionada) {
      showToast('Por favor selecciona una ruta', 'warning')
      return
    }

    try {
      setLoading(true)

      // Llamar a API-012 para asignar ruta
      // NOTA: El frontend usa RUTA_1, RUTA_2, RUTA_3 pero la API espera routeId (uuid)
      // Aquí se necesita mapear el número de ruta a un ID de ruta_diaria real
      // Por ahora, usamos el número directamente (se ajustará según modelo de datos real)
      const routeId = parseInt(rutaSeleccionada)

      await OrdersService.assignOrderToRoute(modalAsignarRuta.pedidoId, routeId)

      closeModal()
      showToast('Pedido asignado a ruta exitosamente', 'success')

      // Refrescar lista de pedidos
      if (refreshPedidos) {
        await refreshPedidos()
      }
    } catch (error) {
      console.error('Error asignando ruta:', error)
      showToast(error.message || 'Error al asignar pedido a ruta', 'error')
    } finally {
      setLoading(false)
    }
  }

  return {
    modalAsignarRuta,
    rutaSeleccionada,
    setRutaSeleccionada,
    openModal,
    closeModal,
    confirmarAsignacion,
    loading
  }
}
