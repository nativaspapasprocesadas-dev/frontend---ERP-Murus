import { useState, useEffect, useMemo, useCallback } from 'react'
import OrdersService from '@services/OrdersService'
import useAuthStore from '@features/auth/useAuthStore'
import { ROLES } from '@utils/constants'

/**
 * Hook para fetching y filtrado de pedidos desde API real
 * Reemplaza usePedidosData que usaba useMockPedidos
 * Integrado con API-006 (Listar pedidos)
 *
 * IMPORTANTE: Este hook ahora escucha sedeIdActiva del store global
 * para filtrar pedidos cuando el SUPERADMINISTRADOR cambia de sede
 */
export const usePedidosDataReal = ({ user, isRole, filtroEstado }) => {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  // Obtener sedeIdActiva del store global para filtrar por sede
  const { sedeIdActiva, isSuperAdmin } = useAuthStore()

  // Cargar pedidos desde API
  const loadPedidos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const filters = { pageSize: 0 }

      // Si hay filtro de estado, aplicarlo
      if (filtroEstado) {
        filters.status = filtroEstado
      }

      // SUPERADMINISTRADOR: filtrar por sedeIdActiva si está seleccionada
      // Si sedeIdActiva es null, se muestran todas las sedes
      if (isSuperAdmin() && sedeIdActiva) {
        filters.branchId = sedeIdActiva
      }

      const result = await OrdersService.listOrders(filters)
      setPedidos(result.pedidos || [])
    } catch (err) {
      console.error('Error cargando pedidos:', err)
      setError(err.message)
      setPedidos([])
    } finally {
      setLoading(false)
    }
  }, [filtroEstado, sedeIdActiva, isSuperAdmin])

  // Cargar pedidos al montar y cuando cambie el filtro
  useEffect(() => {
    loadPedidos()
  }, [loadPedidos])

  // Ordenar pedidos por fecha descendente
  const pedidosOrdenados = useMemo(() => {
    return [...pedidos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [pedidos])

  // Resetear a página 1 cuando cambian los datos o filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [pedidos, filtroEstado])

  // Paginación client-side
  const totalPages = Math.ceil(pedidosOrdenados.length / pageSize)

  const pedidosFiltrados = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return pedidosOrdenados.slice(start, start + pageSize)
  }, [pedidosOrdenados, currentPage, pageSize])

  const pagination = useMemo(() => ({
    page: currentPage,
    pageSize,
    total: pedidosOrdenados.length,
    totalPages
  }), [currentPage, pageSize, pedidosOrdenados.length, totalPages])

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }, [totalPages])

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1)
  }, [currentPage, totalPages])

  const prevPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1)
  }, [currentPage])

  // Actualizar pedido (para acciones como editar, asignar ruta, etc)
  const updatePedido = useCallback(async (pedidoId, cambios) => {
    try {
      // Actualizar localmente de forma optimista
      setPedidos(prev => prev.map(p =>
        p.id === pedidoId ? { ...p, ...cambios } : p
      ))

      // Recargar desde el servidor para tener datos frescos
      await loadPedidos()
    } catch (err) {
      console.error('Error actualizando pedido:', err)
      // Revertir en caso de error
      await loadPedidos()
      throw err
    }
  }, [loadPedidos])

  // Cancelar pedido
  // Integrado con API-011 POST /api/v1/orders/{id}/cancel
  const cancelPedido = useCallback(async (pedidoId, reason = '') => {
    try {
      // Llamar a API-011 para cancelar el pedido
      await OrdersService.cancelOrder(pedidoId, reason)

      // Recargar lista de pedidos para obtener datos actualizados
      await loadPedidos()

      return { success: true }
    } catch (err) {
      console.error('Error cancelando pedido:', err)
      // Recargar para asegurar consistencia
      await loadPedidos()
      return {
        success: false,
        error: err.message || 'Error al cancelar el pedido'
      }
    }
  }, [loadPedidos])

  return {
    pedidosExpandidos: pedidos,
    pedidosFiltrados,
    loading,
    error,
    update: updatePedido,
    cancelPedido,
    refresh: loadPedidos,
    // Alias para compatibilidad con hooks de modales
    refreshPedidos: loadPedidos,
    // Paginación
    pagination,
    goToPage,
    nextPage,
    prevPage
  }
}
