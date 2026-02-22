/**
 * Hook para obtener resumen de reportes desde API-061
 * Reemplaza useMockPedidos, useMockClientes y useMockMovimientosCredito en ELM-143 a ELM-147
 * Usado por: ELM-143 (Reportes), ELM-144 (Resumen Ventas), ELM-145 (Top Clientes),
 *            ELM-146 (Top Productos), ELM-147 (Estado Cartera)
 */
import { useState, useEffect, useCallback } from 'react'
import { getReportsSummary } from '@/services/ReportsService'
import { toast } from 'sonner'
import useAuthStore from '@features/auth/useAuthStore'

/**
 * Hook que consume API-061 GET /api/v1/reports/summary
 * Retorna datos consolidados para todos los componentes de la vista Reportes
 * Escucha cambios de sede para SUPERADMINISTRADOR
 */
export const useReportsSummary = () => {
  // Obtener sede activa del store (para SUPERADMINISTRADOR)
  const { sedeIdActiva, getSedeIdParaFiltro } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({
    totalOrders: 0,
    totalKilos: 0,
    totalAmount: 0,
    topClients: [],
    topProducts: [],
    portfolioStatus: {
      totalDebt: 0,
      customersWithDebt: 0,
      overdueDebt: 0,
      customersWithOverdueDebt: 0,
      customersNearLimit: 0
    }
  })

  // Filtros opcionales - ahora incluye branchId del selector de sede
  const [filters, setFilters] = useState({
    dateFrom: null,
    dateTo: null,
    branchId: null
  })

  /**
   * Cargar datos del resumen desde API-061
   * Usa la sede activa del selector global para filtrar
   */
  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Obtener branchId del selector de sede global
      const branchIdParaFiltro = getSedeIdParaFiltro()

      const filtersConSede = {
        ...filters,
        branchId: branchIdParaFiltro
      }

      const response = await getReportsSummary(filtersConSede)

      if (response.success) {
        setData({
          totalOrders: response.totalOrders || 0,
          totalKilos: response.totalKilos || 0,
          totalAmount: response.totalAmount || 0,
          topClients: response.topClients || [],
          topProducts: response.topProducts || [],
          portfolioStatus: response.portfolioStatus || {
            totalDebt: 0,
            customersWithDebt: 0,
            overdueDebt: 0,
            customersWithOverdueDebt: 0,
            customersNearLimit: 0
          }
        })
      } else {
        throw new Error(response.error || 'Error al cargar resumen de reportes')
      }
    } catch (err) {
      console.error('Error loading reports summary:', err)
      setError(err.message)

      if (err.response?.status === 403) {
        toast.error('No tiene permisos para acceder a este reporte')
      } else {
        toast.error('Error al cargar el resumen de reportes')
      }
    } finally {
      setLoading(false)
    }
  }, [filters, getSedeIdParaFiltro])

  /**
   * Cargar datos al montar el componente y cuando cambie la sede activa
   */
  useEffect(() => {
    loadSummary()
  }, [loadSummary, sedeIdActiva])

  /**
   * Refrescar datos manualmente
   */
  const refresh = useCallback(() => {
    loadSummary()
  }, [loadSummary])

  /**
   * Actualizar filtros (para uso futuro)
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  return {
    // Datos principales
    data,
    loading,
    error,

    // Accesos directos para facilitar uso en componentes
    totalOrders: data.totalOrders,
    totalKilos: data.totalKilos,
    totalAmount: data.totalAmount,
    topClients: data.topClients,
    topProducts: data.topProducts,
    portfolioStatus: data.portfolioStatus,

    // Acciones
    refresh,
    updateFilters
  }
}

export default useReportsSummary
