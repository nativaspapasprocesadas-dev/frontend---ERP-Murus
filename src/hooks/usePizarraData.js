/**
 * Hook usePizarraData - Datos reales de la pizarra de produccion
 *
 * Este hook reemplaza useMockPedidos y useMockRutas para la Pizarra de Produccion.
 * Obtiene datos directamente del endpoint /api/v1/production/board
 *
 * El campo "listo" viene directamente en cada detalle de pedido desde el backend.
 *
 * Retorna:
 *   - pedidosExpandidos: Array de pedidos con detalles expandidos (incluye campo listo)
 *   - rutasAbiertasHoy: Array de rutas activas del dia
 *   - loading: boolean
 *   - error: string | null
 *   - refetch: Function para recargar datos
 *   - toggleItemListo: Function para marcar/desmarcar un detalle como listo
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getProductionBoard, toggleItemListo as toggleItemListoApi, toggleItemsListoBatch as toggleItemsListoBatchApi } from '@services/PizarraService'
import { onEvent, offEvent, joinBranch, joinGlobal, onReconnect, offReconnect } from '@services/socketService'
import useAuthStore from '@features/auth/useAuthStore'
import { getLocalDate } from '@utils/dateUtils'

export const usePizarraData = (options = {}) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { getSedeIdParaFiltro, user } = useAuthStore()

  // Parametro enabled para controlar si el hook debe hacer fetch
  // Por defecto true, pero se puede deshabilitar para roles sin acceso
  const enabled = options.enabled !== false

  // Obtener fecha del parametro o usar hoy (usa getLocalDate para evitar problemas de timezone)
  const targetDate = options.date || getLocalDate()

  // Obtener sede del parametro o usar la sede activa del usuario
  const branchId = options.branchId || getSedeIdParaFiltro()

  /**
   * Cargar datos de la pizarra desde el backend
   * Incluye el campo "listo" directamente en cada detalle
   */
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // C8: No enviar fecha del cliente - el servidor usa su propia fecha autoritativa (Peru)
      // Solo enviar fecha si el usuario explicitamente selecciono una fecha diferente
      const result = await getProductionBoard({
        date: options.date,
        branchId
      })

      if (result.success) {
        setData(result)
      } else {
        setError(result.error || 'Error al cargar la pizarra')
      }
    } catch (err) {
      console.error('Error cargando pizarra de produccion:', err)
      setError(err.message || 'Error de conexion')
    } finally {
      setLoading(false)
    }
  }, [targetDate, branchId])

  // Cargar datos al montar o cuando cambien los parametros
  // Solo si enabled es true (roles con acceso a la pizarra)
  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    fetchData()
  }, [fetchData, enabled])

  // Suscribirse a eventos Socket.IO para actualizacion en tiempo real
  const fetchDataRef = useRef(fetchData)
  fetchDataRef.current = fetchData
  const debounceTimerRef = useRef(null)

  useEffect(() => {
    if (!enabled) return

    // C2: No unirse a salas hasta que el usuario este cargado (evita joinGlobal erroneo durante hidratacion de Zustand)
    if (!user) return

    // Unirse a la sala correspondiente para recibir eventos
    if (branchId) {
      joinBranch(branchId)
    } else {
      joinGlobal()
    }

    // Handler con debounce para refetch cuando llega un evento relevante
    // Evita multiples refetch si llegan varios eventos seguidos (ej: crear + asignar ruta)
    const handleRefetch = () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        fetchDataRef.current()
      }, 500)
    }

    // C3+C7: Refetch al reconectar para recuperar eventos perdidos durante desconexion/redeploy
    const handleReconnect = () => {
      fetchDataRef.current()
    }

    // Handler especifico para toggle item listo (optimistic update via socket)
    // Ignora eventos propios ya que el optimistic update local ya los aplico
    const handleItemListo = (payload) => {
      if (payload.userId === user?.id) return
      setData(prev => {
        if (!prev?.pedidos) return prev
        return {
          ...prev,
          pedidos: prev.pedidos.map(pedido => ({
            ...pedido,
            detalles: pedido.detalles.map(detalle =>
              detalle.id === payload.detalleId
                ? { ...detalle, listo: payload.listo }
                : detalle
            )
          }))
        }
      })
    }

    // Escuchar todos los eventos que afectan la pizarra
    onEvent('pedido:creado', handleRefetch)
    onEvent('pedido:actualizado', handleRefetch)
    onEvent('pedido:cancelado', handleRefetch)
    onEvent('pedido:entregado', handleRefetch)
    onEvent('pedido:ruta-asignada', handleRefetch)
    onEvent('produccion:item-listo', handleItemListo)
    onReconnect(handleReconnect)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      offEvent('pedido:creado', handleRefetch)
      offEvent('pedido:actualizado', handleRefetch)
      offEvent('pedido:cancelado', handleRefetch)
      offEvent('pedido:entregado', handleRefetch)
      offEvent('pedido:ruta-asignada', handleRefetch)
      offEvent('produccion:item-listo', handleItemListo)
      offReconnect(handleReconnect)
    }
  }, [enabled, branchId, user?.id])

  /**
   * Toggle item como listo (persiste en backend)
   * Ahora recibe el detalleId directamente
   */
  const toggleItemListo = useCallback(async (detalleId) => {
    // Optimistic update - actualizar el estado local inmediatamente
    setData(prev => {
      if (!prev?.pedidos) return prev
      return {
        ...prev,
        pedidos: prev.pedidos.map(pedido => ({
          ...pedido,
          detalles: pedido.detalles.map(detalle =>
            detalle.id === detalleId
              ? { ...detalle, listo: !detalle.listo }
              : detalle
          )
        }))
      }
    })

    try {
      const result = await toggleItemListoApi({ detalleId })

      if (!result.success) {
        // Revertir si falla
        setData(prev => {
          if (!prev?.pedidos) return prev
          return {
            ...prev,
            pedidos: prev.pedidos.map(pedido => ({
              ...pedido,
              detalles: pedido.detalles.map(detalle =>
                detalle.id === detalleId
                  ? { ...detalle, listo: !detalle.listo }
                  : detalle
              )
            }))
          }
        })
        console.error('Error al guardar estado listo:', result.error)
      }
    } catch (err) {
      // Revertir si falla
      setData(prev => {
        if (!prev?.pedidos) return prev
        return {
          ...prev,
          pedidos: prev.pedidos.map(pedido => ({
            ...pedido,
            detalles: pedido.detalles.map(detalle =>
              detalle.id === detalleId
                ? { ...detalle, listo: !detalle.listo }
                : detalle
            )
          }))
        }
      })
      console.error('Error al guardar estado listo:', err)
    }
  }, [])

  /**
   * Verificar si un detalle esta listo (por detalleId)
   */
  const isItemListo = useCallback((detalleId) => {
    if (!data?.pedidos) return false
    for (const pedido of data.pedidos) {
      const detalle = pedido.detalles.find(d => d.id === detalleId)
      if (detalle) return detalle.listo || false
    }
    return false
  }, [data])

  /**
   * Toggle batch: marcar/desmarcar multiples detalles como listos en una sola operacion
   * @param {number[]} detalleIds - IDs de los detalles a toggle
   * @param {boolean} targetListo - Valor objetivo
   */
  const toggleItemsListoBatch = useCallback(async (detalleIds, targetListo) => {
    if (!detalleIds || detalleIds.length === 0) return

    // Optimistic update - actualizar todos los detalles localmente
    setData(prev => {
      if (!prev?.pedidos) return prev
      const idsSet = new Set(detalleIds)
      return {
        ...prev,
        pedidos: prev.pedidos.map(pedido => ({
          ...pedido,
          detalles: pedido.detalles.map(detalle =>
            idsSet.has(detalle.id)
              ? { ...detalle, listo: targetListo }
              : detalle
          )
        }))
      }
    })

    try {
      const result = await toggleItemsListoBatchApi({ detalleIds, targetListo })

      if (!result.success) {
        // Revertir si falla
        setData(prev => {
          if (!prev?.pedidos) return prev
          const idsSet = new Set(detalleIds)
          return {
            ...prev,
            pedidos: prev.pedidos.map(pedido => ({
              ...pedido,
              detalles: pedido.detalles.map(detalle =>
                idsSet.has(detalle.id)
                  ? { ...detalle, listo: !targetListo }
                  : detalle
              )
            }))
          }
        })
        console.error('Error al guardar estado listo batch:', result.error)
      }
    } catch (err) {
      // Revertir si falla
      setData(prev => {
        if (!prev?.pedidos) return prev
        const idsSet = new Set(detalleIds)
        return {
          ...prev,
          pedidos: prev.pedidos.map(pedido => ({
            ...pedido,
            detalles: pedido.detalles.map(detalle =>
              idsSet.has(detalle.id)
                ? { ...detalle, listo: !targetListo }
                : detalle
            )
          }))
        }
      })
      console.error('Error al guardar estado listo batch:', err)
    }
  }, [])

  /**
   * Pedidos expandidos (compatibles con el formato del mock)
   * Transforma los pedidos del backend al formato esperado por Pizarra.jsx
   */
  const pedidosExpandidos = useMemo(() => {
    if (!data?.pedidos) return []

    return data.pedidos.map(pedido => ({
      id: pedido.id,
      numero: pedido.numero,
      fecha: pedido.fecha,
      estado: pedido.estado,
      rutaId: pedido.rutaId,
      // Mapear detalles al formato esperado
      detalles: (pedido.detalles || []).map(detalle => ({
        id: detalle.id,
        cantidad: detalle.cantidad,
        listo: detalle.listo || false,
        producto: detalle.producto,
        especie: detalle.especie,
        medida: detalle.medida,
        presentacion: {
          ...detalle.presentacion,
          // Asegurar que kilos este disponible
          kilos: detalle.presentacion?.kilos || 1
        }
      }))
    }))
  }, [data])

  /**
   * Rutas abiertas de hoy (compatibles con el formato del mock)
   * Transforma las rutas del backend al formato esperado por Pizarra.jsx
   */
  const rutasAbiertasHoy = useMemo(() => {
    if (!data?.rutas) return []

    return data.rutas.map(ruta => ({
      id: ruta.id,
      numero: ruta.numero,
      nombre: ruta.nombre,
      estado: ruta.estado,
      fecha: ruta.fecha,
      color: ruta.color // Color configurado de la ruta
    }))
  }, [data])

  /**
   * Estadisticas del dia
   */
  const stats = useMemo(() => {
    return data?.stats || {
      totalPedidos: 0,
      totalRutas: 0,
      pedidosConRuta: 0,
      pedidosSinRuta: 0
    }
  }, [data])

  /**
   * Pedidos agendados para fechas futuras
   * Array de { fecha, cantidad } para mostrar mensaje "X pedidos agendados para el día Y"
   */
  const pedidosAgendados = useMemo(() => {
    return data?.pedidosAgendados || []
  }, [data])

  return {
    // Datos compatibles con el formato mock
    pedidosExpandidos,
    rutasAbiertasHoy,

    // Estado de carga
    loading,
    error,

    // Fecha y estadisticas
    date: data?.date || targetDate,
    stats,
    pedidosAgendados,

    // Toggle de items listos (ahora por detalleId)
    toggleItemListo,
    toggleItemsListoBatch,
    isItemListo,

    // Funcion para recargar
    refetch: fetchData
  }
}

export default usePizarraData
