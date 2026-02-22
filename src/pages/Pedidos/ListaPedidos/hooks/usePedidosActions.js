import { useNavigate } from 'react-router-dom'
import { PedidoAdicionalService } from '@services/PedidoAdicionalService'
import { getOrderById } from '@services/OrdersService'
import { ESTADOS_PEDIDO, TIPOS_PAGO_LABELS, TIPOS_PAGO, ROLES } from '@utils/constants'
import { formatearFecha } from '@utils/formatters'
import { numeroALetras } from '@utils/numeroALetras'
import jsPDF from 'jspdf'

/**
 * Hook para acciones de pedidos (cambiar estado, imprimir, navegación)
 *
 * @param {Object} params
 * @param {Function} params.update - Función para actualizar pedidos
 * @param {Function} params.showToast - Función para mostrar notificaciones
 * @param {Object} params.user - Usuario autenticado
 * @param {Object} params.empresaConfig - Configuración de empresa para PDFs
 */
export const usePedidosActions = ({ update, showToast, user, empresaConfig }) => {
  const navigate = useNavigate()

  const handleChangeEstado = async (pedidoId, nuevoEstado) => {
    await update(pedidoId, { estado: nuevoEstado })
    showToast('Estado del pedido actualizado', 'success')
  }

  const handleVerDetalle = (pedidoId) => {
    navigate(`/pedidos/${pedidoId}`)
  }

  const handleNuevoPedido = () => {
    navigate('/pedidos/nuevo')
  }

  /**
   * Imprimir ticket del pedido - usa el mismo formato que DetallePedido.jsx
   * Carga los datos completos del pedido desde la API antes de generar
   */
  const handleImprimirPedido = async (pedido) => {
    if (!empresaConfig) {
      console.error('No se puede generar PDF: configuración de empresa no disponible')
      showToast?.('No se pudo generar el PDF. Intenta recargar la página.', 'error')
      return
    }

    try {
      showToast?.('Generando ticket...', 'info')

      // Cargar datos completos del pedido desde la API
      const pedidoCompleto = await getOrderById(pedido.id)

      // Generar Nota de Venta Térmica (formato estandarizado 80mm) - mismo código de DetallePedido.jsx
      const doc = new jsPDF({
        format: [80, 220]
      })
      const empresa = empresaConfig
      const anchoTicket = 80
      let yPos = 5

      // Obtener todos los detalles
      const detalles = pedidoCompleto.detalles || []

      // ============================================
      // ENCABEZADO - Logo centrado arriba, texto debajo
      // ============================================
      const logoWidth = 22
      const logoHeight = 22
      const logoX = (anchoTicket - logoWidth) / 2

      try {
        doc.addImage('/logoPapas.png', 'PNG', logoX, yPos, logoWidth, logoHeight)
      } catch (error) {
        console.error('Error al cargar logo:', error)
      }

      yPos += logoHeight + 2

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(empresa.razonSocial || 'EMPRESA', anchoTicket / 2, yPos, { align: 'center' })

      yPos += 4
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`TEL ${empresa.telefonoPlanta || ''}`, anchoTicket / 2, yPos, { align: 'center' })

      yPos += 3
      doc.text(`Registro Sanitario ${empresa.registroSanitario || ''}`, anchoTicket / 2, yPos, { align: 'center' })

      yPos += 3
      doc.setFont('helvetica', 'bold')
      doc.text(`RUC ${empresa.ruc || ''}`, anchoTicket / 2, yPos, { align: 'center' })

      // Línea separadora
      yPos += 4
      doc.setDrawColor(0, 0, 0)
      doc.line(5, yPos, anchoTicket - 5, yPos)

      // ============================================
      // TÍTULO
      // ============================================
      yPos += 5
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('NOTA DE VENTA', anchoTicket / 2, yPos, { align: 'center' })

      yPos += 4
      doc.setFontSize(9)
      // Usar branchCode del pedido, o sedeCode de empresa como fallback, o 'NV' por defecto
      const codigoSede = pedidoCompleto.branchCode || empresa.sedeCode || 'NV'
      // Usar correlativoSede si está disponible, sino usar pedidoCompleto.id como fallback
      const numeroDocumento = pedidoCompleto.correlativoSede || pedidoCompleto.id
      doc.text(`${codigoSede}01 - ${String(numeroDocumento).padStart(8, '0')}`, anchoTicket / 2, yPos, { align: 'center' })

      // Línea separadora
      yPos += 4
      doc.line(5, yPos, anchoTicket - 5, yPos)

      // ============================================
      // INFORMACIÓN DEL DOCUMENTO
      // ============================================
      yPos += 5
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('CLIENTE:', 5, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(pedidoCompleto.nombreCliente || 'Sin nombre', 22, yPos)

      yPos += 4
      doc.setFont('helvetica', 'bold')
      doc.text('FECHA EMISIÓN:', 5, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(formatearFecha(pedidoCompleto.fecha, 'dd/MM/yyyy'), 35, yPos)

      // VENDEDOR (solo si el usuario actual NO es cliente)
      if (user && user.rol !== ROLES.CLIENTE) {
        yPos += 4
        doc.setFont('helvetica', 'bold')
        doc.text('VENDEDOR:', 5, yPos)
        doc.setFont('helvetica', 'normal')
        const rolCapitalizado = user.rol ? user.rol.charAt(0).toUpperCase() + user.rol.slice(1) : 'Sistema'
        doc.text(rolCapitalizado, 25, yPos)
      }

      // Línea separadora
      yPos += 5
      doc.line(5, yPos, anchoTicket - 5, yPos)

      // ============================================
      // TABLA DE PRODUCTOS
      // ============================================
      yPos += 4
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text('[CANT.]', 5, yPos)
      doc.text('KILOS', 17, yPos)
      doc.text('DESCRIPCIÓN', 28, yPos)
      doc.text('P/U', 55, yPos)
      doc.text('TOTAL', anchoTicket - 5, yPos, { align: 'right' })

      yPos += 2
      doc.line(5, yPos, anchoTicket - 5, yPos)

      // Productos
      doc.setFont('helvetica', 'normal')
      detalles.forEach(detalle => {
        yPos += 4

        const cantidad = detalle.cantidad || 1
        const kilosBolsa = detalle.kilosPorBolsa || 1
        const kilosTotales = cantidad * kilosBolsa
        const precioKg = detalle.precioKg || detalle.precioUnitario || 0
        const subtotal = detalle.subtotal || (kilosTotales * precioKg)

        // [Cantidad]
        doc.text(`[${cantidad}]`, 5, yPos)

        // Kilos totales
        doc.text(`${kilosTotales}kg`, 17, yPos)

        // Descripción del producto
        const descripcion = detalle.nombreProducto || `${detalle.especie?.nombre || ''} ${detalle.medida?.nombre || ''}`.trim() || 'Producto'
        const descWrapped = doc.splitTextToSize(descripcion, 24)
        doc.text(descWrapped, 28, yPos)

        // Precio unitario
        doc.text(precioKg.toFixed(2), 55, yPos)

        // Total
        doc.text(subtotal.toFixed(2), anchoTicket - 5, yPos, { align: 'right' })

        yPos += (descWrapped.length - 1) * 3 + 2
      })

      // Línea separadora
      yPos += 3
      doc.line(5, yPos, anchoTicket - 5, yPos)

      // ============================================
      // TOTALES
      // ============================================
      const totalMonto = pedidoCompleto.total || pedidoCompleto.totalMonto || 0

      yPos += 4
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('SUBTOTAL S/.:', 5, yPos)
      doc.text(totalMonto.toFixed(2), anchoTicket - 5, yPos, { align: 'right' })

      yPos += 5
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('TOTAL A PAGAR S/.:', 5, yPos)
      doc.text(totalMonto.toFixed(2), anchoTicket - 5, yPos, { align: 'right' })

      // IMPORTE EN LETRAS
      yPos += 5
      doc.setFontSize(6)
      doc.setFont('helvetica', 'normal')
      const totalEnLetras = numeroALetras(totalMonto)
      const letrasWrapped = doc.splitTextToSize(`IMPORTE EN LETRAS: ${totalEnLetras}`, anchoTicket - 10)
      doc.text(letrasWrapped, 5, yPos)
      yPos += letrasWrapped.length * 3

      // Línea separadora
      yPos += 2
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(5, yPos, anchoTicket - 5, yPos)

      // ============================================
      // FORMA DE PAGO
      // ============================================
      yPos += 4
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      const tipoPagoTexto = TIPOS_PAGO_LABELS[pedidoCompleto.tipoPago] || pedidoCompleto.tipoPago || 'Contado'
      doc.text(`Forma de pago: ${tipoPagoTexto}`, anchoTicket / 2, yPos, { align: 'center' })

      // Estado de pago anticipado
      if (pedidoCompleto.pagadoAnticipado) {
        yPos += 4
        doc.setFont('helvetica', 'bold')
        doc.text('*** YA PAGADO ***', anchoTicket / 2, yPos, { align: 'center' })
      }

      // Información de crédito si aplica
      if (pedidoCompleto.tipoPago === TIPOS_PAGO.CREDITO && pedidoCompleto.diasCredito) {
        yPos += 4
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.text(`El pago se realizará al: Crédito ${pedidoCompleto.diasCredito} día(s)`, anchoTicket / 2, yPos, { align: 'center' })
      }

      // Línea separadora punteada
      yPos += 4
      doc.setLineWidth(0.1)
      doc.setLineDash([2, 2])
      doc.line(5, yPos, anchoTicket - 5, yPos)
      doc.setLineDash([])
      doc.setLineWidth(0.5)

      // ============================================
      // PIE DE PÁGINA
      // ============================================
      yPos += 5
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.text('¡Gracias por su compra!', anchoTicket / 2, yPos, { align: 'center' })

      yPos += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.text(`Impreso: ${formatearFecha(new Date().toISOString(), 'dd/MM/yyyy HH:mm')}`, anchoTicket / 2, yPos, { align: 'center' })

      // Abrir en nueva ventana para imprimir
      window.open(doc.output('bloburl'), '_blank')

      showToast?.('Ticket generado correctamente', 'success')
    } catch (error) {
      console.error('Error al generar ticket:', error)
      showToast?.(`Error al generar ticket: ${error.message}`, 'error')
    }
  }

  // Flujo de estados para pedidos normales y adicionales
  const getSiguienteEstado = (estadoActual, pedido) => {
    if (PedidoAdicionalService.isPedidoAdicional(pedido)) {
      return PedidoAdicionalService.getSiguienteEstadoAdicional(estadoActual)
    }

    const flujo = {
      [ESTADOS_PEDIDO.PENDIENTE]: ESTADOS_PEDIDO.EN_PROCESO,
      [ESTADOS_PEDIDO.EN_PROCESO]: ESTADOS_PEDIDO.COMPLETADO
    }
    return flujo[estadoActual]
  }

  const getBotonSiguienteEstado = (estadoActual, pedido) => {
    if (PedidoAdicionalService.isPedidoAdicional(pedido)) {
      return PedidoAdicionalService.getBotonSiguienteEstadoAdicional(estadoActual)
    }

    const labels = {
      [ESTADOS_PEDIDO.PENDIENTE]: 'Pasar a En Proceso',
      [ESTADOS_PEDIDO.EN_PROCESO]: 'Marcar Completado'
    }
    return labels[estadoActual] || 'Siguiente'
  }

  return {
    handleChangeEstado,
    handleVerDetalle,
    handleNuevoPedido,
    handleImprimirPedido,
    getSiguienteEstado,
    getBotonSiguienteEstado
  }
}
