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

  // Obtener sedeIdActiva del store global para filtrar por sede
  const { sedeIdActiva, isSuperAdmin } = useAuthStore()

  // Cargar pedidos desde API
  const loadPedidos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const filters = {}

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

  // Filtrar pedidos según rol del usuario
  // NOTA: El backend ya filtra por customer_id cuando el rol es CLIENTE (ordersModel.js linea 27-29)
  // No es necesario filtrar nuevamente en frontend
  const pedidosFiltrados = useMemo(() => {
    // Ordenar por fecha descendente (createdAt viene de la API)
    return [...pedidos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [pedidos])

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
    refreshPedidos: loadPedidos
  }
}
