import { useMemo } from 'react'
import { ESTADOS_PEDIDO } from '@utils/constants'

/**
 * Hook para cálculo de estadísticas de pedidos
 */
export const usePedidosStats = (pedidosFiltrados) => {
  const stats = useMemo(() => {
    return {
      total: pedidosFiltrados.length,
      pendientes: pedidosFiltrados.filter(p => p.estado === ESTADOS_PEDIDO.PENDIENTE).length,
      enProceso: pedidosFiltrados.filter(p => p.estado === ESTADOS_PEDIDO.EN_PROCESO).length,
      completados: pedidosFiltrados.filter(p => p.estado === ESTADOS_PEDIDO.COMPLETADO).length
    }
  }, [pedidosFiltrados])

  return stats
}
