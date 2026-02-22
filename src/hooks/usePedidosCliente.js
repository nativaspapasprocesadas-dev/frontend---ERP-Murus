import { useState, useEffect, useRef } from 'react'
import { listOrders } from '@services/OrdersService'
import useAuthStore from '@features/auth/useAuthStore'
import { ESTADOS_PEDIDO, ROLES } from '@utils/constants'
import { getLocalDate } from '@utils/dateUtils'

/**
 * Hook para obtener los pedidos del cliente actual
 * INTEGRADO CON API REAL: GET /api/v1/orders (API-006)
 *
 * El backend filtra automaticamente por customer_id basado en el token JWT
 * cuando el rol es CLIENTE.
 *
 * @returns {Object} { pedidos, pedidosPendientes, pedidosHoy, loading, error, refresh }
 */
export const usePedidosCliente = () => {
  const { user } = useAuthStore()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const loadedRef = useRef(false)

  // Solo ejecutar si es usuario CLIENTE
  const esCliente = user?.rol === ROLES.CLIENTE

  const fetchPedidos = async () => {
    // No hacer fetch si no es cliente
    if (!esCliente) {
      setPedidos([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      // API-006: El backend filtra por cliente automaticamente si el rol es CLIENTE
      const response = await listOrders({
        page: 1,
        pageSize: 50 // Ultimos 50 pedidos del cliente
      })

      setPedidos(response.pedidos || [])
    } catch (err) {
      console.error('[usePedidosCliente] Error:', err)
      setError(err.message || 'Error al cargar pedidos')
      setPedidos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Solo cargar una vez al montar y si es cliente
    if (!loadedRef.current && esCliente) {
      loadedRef.current = true
      fetchPedidos()
    }
  }, [esCliente])

  // Pedidos pendientes (estado PENDIENTE o EN_PROCESO)
  const pedidosPendientes = pedidos.filter(p =>
    p.estado === ESTADOS_PEDIDO.PENDIENTE ||
    p.estado === ESTADOS_PEDIDO.EN_PROCESO
  )

  // Pedidos de hoy (usa getLocalDate para evitar problemas de timezone)
  const pedidosHoy = pedidos.filter(p => {
    const hoy = getLocalDate()
    const fechaPedido = p.fecha?.split('T')[0] || ''
    return fechaPedido === hoy
  })

  return {
    pedidos,
    pedidosPendientes,
    pedidosHoy,
    loading,
    error,
    refresh: fetchPedidos
  }
}
