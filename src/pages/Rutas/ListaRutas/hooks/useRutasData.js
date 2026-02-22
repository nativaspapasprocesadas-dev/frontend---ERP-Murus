// INTEGRACIÓN REAL: APIs reales para Rutas, Choferes y Sedes
// Rutas: API-036, API-037, API-038, API-039, API-040, API-041, API-042
// Choferes: API-032, API-033, API-034, API-035
// Sedes: useBranches (ya integrado previamente)
import { useRoutes } from '@hooks/useRoutes'
import { useDrivers } from '@hooks/useDrivers'
import { useBranches } from '@hooks/useBranches'
import { getRouteById } from '@services/RoutesService'

/**
 * Hook para datos de rutas (fetch y configuración)
 * 100% INTEGRADO CON APIs REALES - Sin MOCKDATA
 */
export const useRutasData = () => {
  // API REAL para rutas (usando hook global)
  const rutasDataReal = useRoutes()

  // API REAL para choferes
  const { choferesOptions, getChoferById, getChoferesOptionsPorSede } = useDrivers()

  // API REAL para sedes
  const { getById: getSedeById } = useBranches()

  // Obtener pedidos de una ruta específica usando API real (API-037)
  const getPedidosDeRuta = async (rutaId) => {
    try {
      const response = await getRouteById(rutaId)
      if (response.success && response.orders) {
        // Mapear campos de la API a los nombres que espera el frontend
        return response.orders.map(order => ({
          id: order.id,
          numeroPedido: order.orderNumber,
          // Nombre del cliente en diferentes formatos para compatibilidad
          clienteNombre: order.customer?.name || 'Sin nombre',
          nombreCliente: order.customer?.name || 'Sin nombre',
          clienteDireccion: order.customer?.address || '',
          direccionCliente: order.customer?.address || '',
          clienteTelefono: order.customer?.phone || '',
          telefonoCliente: order.customer?.phone || '',
          totalKilos: order.totalKilos || 0,
          total: order.total || 0,
          totalMonto: order.total || 0,
          estado: order.status,
          rutaId: rutaId,
          tipoPago: order.tipoPago || order.paymentType || 'PENDIENTE',
          pagadoAnticipado: order.pagadoAnticipado || order.isPrepaid || false,
          diasCredito: order.diasCredito || 0,
          observaciones: order.observations || '',
          fecha: order.fecha || new Date().toISOString(),
          // Incluir detalles/items del pedido para poder imprimir ticket
          items: (order.items || []).map(item => ({
            cantidad: item.quantity || item.cantidad || 1,
            kilosPorBolsa: item.kilos || item.kilosPorBolsa || 1,
            precioKg: item.unitPrice || item.precioUnitario || 0,
            subtotal: item.subtotal || 0,
            nombreProducto: item.productName || item.nombreProducto || 'Producto',
            especie: { nombre: item.species || item.especieNombre || '' },
            medida: { nombre: item.measure || item.medidaNombre || '' },
            presentacion: { kilos: item.kilos || 1 }
          })),
          // Alias para compatibilidad
          detalles: (order.items || []).map(item => ({
            cantidad: item.quantity || item.cantidad || 1,
            kilosPorBolsa: item.kilos || item.kilosPorBolsa || 1,
            precioKg: item.unitPrice || item.precioUnitario || 0,
            subtotal: item.subtotal || 0,
            nombreProducto: item.productName || item.nombreProducto || 'Producto',
            especie: { nombre: item.species || item.especieNombre || '' },
            medida: { nombre: item.measure || item.medidaNombre || '' },
            presentacion: { kilos: item.kilos || 1 }
          }))
        }))
      }
      return []
    } catch (error) {
      console.error('Error obteniendo pedidos de ruta:', error)
      return []
    }
  }

  return {
    // Datos de rutas (API REAL)
    rutasExpandidas: rutasDataReal.rutasExpandidas,
    rutasHoy: rutasDataReal.rutasHoy,
    rutasFuturas: rutasDataReal.rutasFuturas, // Rutas programadas para fechas futuras
    rutasHistorial: rutasDataReal.rutasHistorial,
    update: rutasDataReal.update,
    loading: rutasDataReal.loading,
    error: rutasDataReal.error,

    // Paginación de historial
    historialLimit: rutasDataReal.historialLimit,
    loadMoreHistorial: rutasDataReal.loadMoreHistorial,
    setHistorialLimit: rutasDataReal.setHistorialLimit,

    // Pedidos de ruta (API REAL - API-037)
    getPedidosDeRuta,

    // Choferes (API REAL - useDrivers)
    choferesOptions,
    getChoferById,
    getChoferesOptionsPorSede,

    // Sedes (API REAL - useBranches)
    getSedeById,

    // Configuración de rutas (API REAL)
    rutasConfig: rutasDataReal.rutasConfig,
    coloresPorNumero: rutasDataReal.coloresPorNumero,
    nombresPorNumero: rutasDataReal.nombresPorNumero,
    createRutaConfig: rutasDataReal.createRutaConfig,
    updateRutaConfig: rutasDataReal.updateRutaConfig,
    desactivarRuta: rutasDataReal.desactivarRuta,
    activarRuta: rutasDataReal.activarRuta
  }
}
