import { ESTADOS_RUTA } from '@utils/constants'
import { generarNotaVentaPDF } from '@services/pdfGenerator'

/**
 * Hook para acciones de rutas (cambiar estado, imprimir ticket)
 */
export const useRutasActions = ({ update, rutasHoy, user, abrirModalChofer, empresaConfig }) => {

  const handleCambiarEstado = async (rutaId, nuevoEstado) => {
    // Si es para enviar, primero asignar chofer
    if (nuevoEstado === ESTADOS_RUTA.ENVIADA) {
      const ruta = rutasHoy.find(r => r.id === rutaId)
      abrirModalChofer(ruta)
      return
    }

    // Para otros cambios de estado
    if (window.confirm(`¿Cambiar el estado de esta ruta?`)) {
      const updates = { estado: nuevoEstado }
      await update(rutaId, updates)
    }
  }

  // Imprimir ticket individual de pedido
  const handleImprimirTicket = (pedido) => {
    // Manejar diferentes estructuras de datos (detalles o items)
    const detalles = pedido.detalles || pedido.items || []

    if (detalles.length === 0) {
      console.warn('[handleImprimirTicket] El pedido no tiene detalles:', pedido)
      alert('El pedido no tiene productos para imprimir')
      return
    }

    const items = detalles.map(detalle => ({
      cantidad: detalle.cantidad || detalle.quantity || 1,
      kilosPorBolsa: detalle.kilosPorBolsa || detalle.presentacion?.kilos || detalle.kilos || 1,
      nombreProducto: `${detalle.especie?.nombre || detalle.species || ''} ${detalle.medida?.nombre || detalle.measure || ''}`.trim() || detalle.nombreProducto || detalle.productName || 'Producto',
      precioKg: detalle.precioKg || detalle.precioUnitario || detalle.unitPrice || 0,
      subtotal: detalle.subtotal || 0
    }))

    if (!empresaConfig) {
      alert('Configuración de empresa no disponible. Intente recargar la página.')
      return
    }

    generarNotaVentaPDF({
      pedidoId: pedido.id,
      correlativoSede: pedido.correlativoSede,
      branchCode: pedido.branchCode,
      cliente: { nombre: pedido.nombreCliente },
      items,
      totales: {
        totalMonto: pedido.totalMonto,
        totalKilos: pedido.totalKilos
      },
      tipoPago: pedido.tipoPago,
      diasCredito: pedido.diasCredito,
      pagadoAnticipado: pedido.pagadoAnticipado,
      user,
      fecha: pedido.fecha,
      empresaConfig
    }, { autoOpen: true })
  }

  return {
    handleCambiarEstado,
    handleImprimirTicket
  }
}
