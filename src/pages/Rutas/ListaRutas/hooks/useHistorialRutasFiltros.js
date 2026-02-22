import { useState, useMemo, useCallback } from 'react'
import { parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns'

/**
 * Hook para filtros y ordenamiento del historial de rutas
 */
export const useHistorialRutasFiltros = (rutasHistorial, rutasConfig) => {
  // Estado de filtros
  const [filtroFechas, setFiltroFechas] = useState({ startDate: '', endDate: '' })
  const [filtroRuta, setFiltroRuta] = useState('')

  // Estado de ordenamiento
  const [sortConfig, setSortConfig] = useState({ key: 'fecha', direction: 'desc' })

  /**
   * Opciones de rutas para el filtro (basado en rutasConfig)
   */
  const opcionesRutas = useMemo(() => {
    return rutasConfig.map(rc => ({
      value: rc.id.toString(),
      label: rc.nombre || `Ruta ${rc.numero}`
    }))
  }, [rutasConfig])

  /**
   * Filtrar rutas por fecha y ruta seleccionada
   */
  const rutasFiltradas = useMemo(() => {
    let resultado = [...rutasHistorial]

    // Filtro por rango de fechas
    if (filtroFechas.startDate && filtroFechas.endDate) {
      const inicio = startOfDay(parseISO(filtroFechas.startDate))
      const fin = endOfDay(parseISO(filtroFechas.endDate))

      resultado = resultado.filter(ruta => {
        if (!ruta.fecha) return false
        const fechaRuta = parseISO(ruta.fecha.split('T')[0])
        return isWithinInterval(fechaRuta, { start: inicio, end: fin })
      })
    }

    // Filtro por ruta específica
    if (filtroRuta) {
      resultado = resultado.filter(ruta =>
        ruta.numero?.toString() === filtroRuta
      )
    }

    return resultado
  }, [rutasHistorial, filtroFechas, filtroRuta])

  /**
   * Ordenar rutas
   */
  const rutasOrdenadas = useMemo(() => {
    const sortedData = [...rutasFiltradas]

    sortedData.sort((a, b) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]

      // Manejar valores nulos
      if (aValue === null || aValue === undefined) aValue = ''
      if (bValue === null || bValue === undefined) bValue = ''

      // Ordenar fechas
      if (sortConfig.key === 'fecha' || sortConfig.key === 'fechaEnvio') {
        aValue = aValue ? new Date(aValue).getTime() : 0
        bValue = bValue ? new Date(bValue).getTime() : 0
      }

      // Ordenar números
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Ordenar strings
      const comparison = String(aValue).localeCompare(String(bValue), 'es', { numeric: true })
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })

    return sortedData
  }, [rutasFiltradas, sortConfig])

  /**
   * Cambiar ordenamiento al hacer clic en cabecera
   */
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  /**
   * Cambiar filtro de fechas
   */
  const handleFiltroFechasChange = useCallback((fechas) => {
    setFiltroFechas(fechas)
  }, [])

  /**
   * Cambiar filtro de ruta
   */
  const handleFiltroRutaChange = useCallback((rutaId) => {
    setFiltroRuta(rutaId)
  }, [])

  /**
   * Limpiar todos los filtros
   */
  const limpiarFiltros = useCallback(() => {
    setFiltroFechas({ startDate: '', endDate: '' })
    setFiltroRuta('')
    setSortConfig({ key: 'fecha', direction: 'desc' })
  }, [])

  /**
   * Verificar si hay filtros activos
   */
  const hayFiltrosActivos = useMemo(() => {
    return filtroFechas.startDate || filtroFechas.endDate || filtroRuta
  }, [filtroFechas, filtroRuta])

  return {
    // Datos filtrados y ordenados
    rutasOrdenadas,

    // Estado de filtros
    filtroFechas,
    filtroRuta,
    sortConfig,

    // Opciones
    opcionesRutas,

    // Handlers
    handleSort,
    handleFiltroFechasChange,
    handleFiltroRutaChange,
    limpiarFiltros,

    // Utils
    hayFiltrosActivos,
    totalFiltradas: rutasFiltradas.length,
    totalOriginal: rutasHistorial.length
  }
}

export default useHistorialRutasFiltros
