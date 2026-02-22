/**
 * Hook para obtener reporte de ventas diarias desde API-062
 * Reemplaza useMockVentasDiarias con integración real
 * Escucha cambios de sede para SUPERADMINISTRADOR
 */
import { useState, useEffect, useCallback } from 'react'
import apiClient from '@/lib/api'
import { toast } from 'sonner'
import useAuthStore from '@features/auth/useAuthStore'
import { getLocalDate, getLocalDateDaysAgo } from '@utils/dateUtils'

// Función helper para obtener fechas por defecto (últimos 30 días)
// Usa funciones de dateUtils para evitar problemas de timezone
const getDefaultDates = () => {
  return {
    inicio: getLocalDateDaysAgo(30),
    fin: getLocalDate()
  }
}

export const useVentasDiarias = () => {
  // Obtener sede activa del store (para SUPERADMINISTRADOR)
  const { sedeIdActiva, getSedeIdParaFiltro } = useAuthStore()

  // Inicializar con fechas por defecto (últimos 30 días)
  const defaultDates = getDefaultDates()

  const [loading, setLoading] = useState(false)
  const [fechaInicio, setFechaInicio] = useState(defaultDates.inicio)
  const [fechaFin, setFechaFin] = useState(defaultDates.fin)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [reportData, setReportData] = useState({
    summary: {
      totalOrders: 0,
      totalAmount: 0,
      totalKilos: 0,
      totalBags: 0,
      totalProducts: 0
    },
    productDetails: []
  })

  /**
   * Llamada a API-062: GET /api/v1/reports/daily-sales
   * Query params: dateFrom, dateTo, branchId (opcional)
   */
  const fetchDailySales = useCallback(async (dateFrom, dateTo) => {
    if (!dateFrom || !dateTo) {
      toast.error('Debe seleccionar rango de fechas')
      return
    }

    setLoading(true)
    try {
      // Obtener branchId del selector de sede global
      const branchIdParaFiltro = getSedeIdParaFiltro()

      const params = { dateFrom, dateTo }
      if (branchIdParaFiltro) {
        params.branchId = branchIdParaFiltro
      }

      const response = await apiClient.get('/reports/daily-sales', { params })

      if (response.data.success) {
        setReportData(response.data)
        setFechaInicio(dateFrom)
        setFechaFin(dateTo)
      } else {
        toast.error(response.data.error || 'Error al obtener el reporte')
      }
    } catch (error) {
      console.error('Error fetching daily sales report:', error)

      if (error.response?.status === 400) {
        toast.error(error.response.data.error || 'Parámetros inválidos')
      } else if (error.response?.status === 403) {
        toast.error('No tiene permisos para acceder a este reporte')
      } else {
        toast.error('Error al cargar el reporte de ventas')
      }
    } finally {
      setLoading(false)
    }
  }, [getSedeIdParaFiltro])

  // Carga inicial automática con fechas por defecto
  useEffect(() => {
    if (!initialLoadDone && fechaInicio && fechaFin) {
      fetchDailySales(fechaInicio, fechaFin)
      setInitialLoadDone(true)
    }
  }, [fetchDailySales, fechaInicio, fechaFin, initialLoadDone])

  // Recargar cuando cambie la sede (si hay fechas seleccionadas)
  useEffect(() => {
    if (initialLoadDone && fechaInicio && fechaFin) {
      fetchDailySales(fechaInicio, fechaFin)
    }
  }, [sedeIdActiva])

  /**
   * Filtrar por rango de fechas
   */
  const filtrarPorFechas = useCallback((inicio, fin) => {
    fetchDailySales(inicio, fin)
  }, [fetchDailySales])

  /**
   * Limpiar filtros - restablece a fechas por defecto (últimos 30 días)
   */
  const limpiarFiltros = useCallback(() => {
    const defaults = getDefaultDates()
    setFechaInicio(defaults.inicio)
    setFechaFin(defaults.fin)
    // Recargar con fechas por defecto
    fetchDailySales(defaults.inicio, defaults.fin)
  }, [fetchDailySales])

  /**
   * Mapeo de datos del API al formato esperado por los componentes
   * API-062 retorna: { summary: { totalOrders, totalAmount, totalKilos, totalBags, totalProducts }, productDetails: [...] }
   * Los componentes esperan: { totales: { totalMonto, cantidadPedidos, totalKilos, totalBolsas, totalProductos }, ventasPorProducto: [...] }
   */
  const totales = {
    totalMonto: reportData.summary?.totalAmount || 0,
    cantidadPedidos: reportData.summary?.totalOrders || 0,
    totalKilos: reportData.summary?.totalKilos || 0,
    totalBolsas: reportData.summary?.totalBags || 0,
    totalProductos: reportData.summary?.totalProducts || 0
  }

  // ventasPorProducto ahora viene directamente de productDetails con la estructura correcta
  // Backend retorna productDetails[] con todos los campos necesarios: productoId, nombreProducto, especie, medida, etc.
  const ventasPorProducto = reportData.productDetails || []

  return {
    ventasPorProducto,
    totales,
    fechaInicio,
    fechaFin,
    filtrarPorFechas,
    limpiarFiltros,
    loading
  }
}
