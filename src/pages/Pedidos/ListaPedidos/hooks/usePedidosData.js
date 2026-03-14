import { useState, useEffect, useMemo, useRef } from 'react'
import { listOrders, cancelOrder as cancelOrderAPI, updateOrder as updateOrderAPI } from '@/services/OrdersService'
import { ROLES } from '@utils/constants'

/**
 * Hook para fetching y filtrado de pedidos según rol
 * INTEGRACION REAL: Consume API-006 GET /api/v1/orders
 * ELIMINADO: useMockPedidos
 */
export const usePedidosData = ({ user, isRole, filtroEstado, filtroSede, busqueda }) => {
  const [pedidosExpandidos, setPedidosExpandidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estado de paginación
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  })

  // Debounce para búsqueda por texto
  const [busquedaDebounced, setBusquedaDebounced] = useState(busqueda || '')
  const debounceRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setBusquedaDebounced(busqueda || '')
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [busqueda])

  // Resetear a página 1 cuando cambia la búsqueda
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [busquedaDebounced])

  // Fetch inicial de pedidos
  useEffect(() => {
    const fetchPedidos = async () => {
      setLoading(true)
      setError(null)

      try {
        // API-006: Backend filtra por customerId si es CLIENTE (basado en token)
        const filters = {
          status: filtroEstado || undefined,
          branchId: filtroSede || undefined,
          search: busquedaDebounced || undefined,
          page: pagination.page,
          pageSize: pagination.pageSize
        }

        const response = await listOrders(filters)

        setPedidosExpandidos(response.pedidos || [])

        // Actualizar paginación con respuesta del backend
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.pagination.total,
            totalPages: response.pagination.totalPages
          }))
        }
      } catch (err) {
        console.error('[usePedidosData] Error cargando pedidos:', err)
        setError(err.message || 'Error al cargar pedidos')
        setPedidosExpandidos([])
      } finally {
        setLoading(false)
      }
    }

    fetchPedidos()
  }, [filtroEstado, filtroSede, busquedaDebounced, pagination.page, pagination.pageSize])

  // Filtrado local (el backend ya filtra por cliente si aplica)
  const pedidosFiltrados = useMemo(() => {
    let pedidos = pedidosExpandidos
    // Ordenar por fecha descendente
    return pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  }, [pedidosExpandidos])

  // Función para refrescar lista de pedidos (vuelve a página 1)
  const refreshPedidos = async () => {
    setLoading(true)
    setError(null)

    try {
      const filters = {
        status: filtroEstado || undefined,
        branchId: filtroSede || undefined,
        search: busqueda || undefined,
        page: 1, // Siempre volver a la primera página al refrescar
        pageSize: pagination.pageSize
      }

      const response = await listOrders(filters)

      setPedidosExpandidos(response.pedidos || [])

      // Actualizar paginación y volver a página 1
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          page: 1,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages
        }))
      }
    } catch (err) {
      console.error('[usePedidosData] Error refrescando:', err)
      setError(err.message || 'Error al cargar pedidos')
      setPedidosExpandidos([])
    } finally {
      setLoading(false)
    }
  }

  // INTEGRADO: API-010 PUT /api/v1/orders/:id
  const update = async (pedidoId, datos) => {
    try {
      await updateOrderAPI(pedidoId, datos)

      // Refrescar lista después de actualizar
      await refreshPedidos()

      return { success: true }
    } catch (err) {
      console.error('[usePedidosData] Error actualizando pedido:', err)
      return { success: false, error: err.message || 'Error al actualizar el pedido' }
    }
  }

  // INTEGRADO: API-011 POST /api/v1/orders/:id/cancel
  const cancelPedido = async (pedidoId) => {
    try {
      await cancelOrderAPI(pedidoId)

      // Refrescar lista después de cancelar
      await refreshPedidos()

      return { success: true }
    } catch (err) {
      console.error('[usePedidosData] Error cancelando pedido:', err)
      return { success: false, error: err.message || 'Error al cancelar el pedido' }
    }
  }

  // Funciones de navegación de paginación
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page }))
    }
  }

  const nextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
    }
  }

  const prevPage = () => {
    if (pagination.page > 1) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }))
    }
  }

  const setPageSize = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }))
  }

  return {
    pedidosExpandidos,
    pedidosFiltrados,
    loading,
    error,
    update,
    cancelPedido,
    refreshPedidos,
    // Paginación
    pagination,
    goToPage,
    nextPage,
    prevPage,
    setPageSize
  }
}
