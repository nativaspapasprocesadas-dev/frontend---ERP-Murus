import { useState, useEffect } from 'react'
import OrdersService from '@services/OrdersService'
import useAuthStore from '@features/auth/useAuthStore'

/**
 * Hook para obtener estadísticas de pedidos desde API real
 * Reemplaza usePedidosStats que calculaba desde datos locales
 * Integrado con API-007 (Obtener estadísticas de pedidos)
 *
 * IMPORTANTE: Este hook ahora escucha sedeIdActiva del store global
 * para filtrar estadísticas cuando el SUPERADMINISTRADOR cambia de sede
 */
export const usePedidosStatsReal = (filters = {}) => {
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    enProceso: 0,
    completados: 0,
    cancelados: 0,
    despachoRuta: 0,
    despachoTaxi: 0,
    despachoRecojo: 0,
    despachoOtro: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Obtener sedeIdActiva del store global para filtrar por sede
  const { sedeIdActiva, isSuperAdmin } = useAuthStore()

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        setError(null)

        // Construir filtros incluyendo sedeIdActiva si aplica
        const statsFilters = { ...filters }

        // SUPERADMINISTRADOR: filtrar por sedeIdActiva si está seleccionada
        if (isSuperAdmin() && sedeIdActiva) {
          statsFilters.branchId = sedeIdActiva
        }

        const result = await OrdersService.getOrdersStats(statsFilters)
        setStats(result)
      } catch (err) {
        console.error('Error cargando estadísticas:', err)
        setError(err.message)
        // Mantener valores en 0 en caso de error
        setStats({
          total: 0,
          pendientes: 0,
          enProceso: 0,
          completados: 0,
          cancelados: 0,
          despachoRuta: 0,
          despachoTaxi: 0,
          despachoRecojo: 0,
          despachoOtro: 0
        })
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [filters.branchId, filters.date, sedeIdActiva, isSuperAdmin])

  return { stats, loading, error }
}
