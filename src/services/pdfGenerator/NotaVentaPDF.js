import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { formatearFecha } from '@utils/formatters'
import { numeroALetras } from '@utils/numeroALetras'
import { TIPOS_PAGO_LABELS, TIPOS_PAGO, ROLES } from '@utils/constants'

/**
 * Genera un PDF de Nota de Venta en formato térmico (80mm)
 *
 * @param {Object} params - Parámetros para generar el PDF
 * @param {number} params.pedidoId - ID del pedido (usado solo como fallback)
 * @param {number} params.correlativoSede - Correlativo independiente por sede (PREFERIDO)
 * @param {string} params.branchCode - Código de la sede (ej: "AQ", "LM")
 * @param {Object} params.cliente - Datos del cliente { nombre, direccion, telefono }
 * @param {Array} params.items - Items del pedido (detalles o carrito)
 * @param {Object} params.totales - { totalMonto, totalKilos }
 * @param {string} params.tipoPago - Tipo de pago (contado/credito)
 * @param {number} params.diasCredito - Días de crédito si aplica
 * @param {boolean} params.pagadoAnticipado - Si ya fue pagado
 * @param {Object} params.user - Usuario que genera el PDF (opcional)
 * @param {Date|string} params.fecha - Fecha del pedido (opcional, default: hoy)
 * @param {Object} params.empresaConfig - Configuración de empresa (REQUERIDO)
 * @param {Object} options - Opciones de generación
 * @param {boolean} options.autoOpen - Abrir en nueva ventana (default: false)
 * @param {boolean} options.autoSave - Descargar automáticamente (default: false)
 * @param {string} options.fileName - Nombre del archivo si autoSave
 * @returns {jsPDF} Documento PDF generado
 */
export const generarNotaVentaPDF = ({
  pedidoId,
  correlativoSede,
  branchCode,
  cliente,
  items,
  totales,
  tipoPago,
  diasCredito,
  pagadoAnticipado = false,
  user = null,
  fecha = new Date(),
  empresaConfig
}, options = {}) => {
  const { autoOpen = false, autoSave = false, fileName = null } = options

  if (!empresaConfig) {
    console.error('NotaVentaPDF: empresaConfig es requerido')
    throw new Error('Configuración de empresa no disponible')
  }

  const doc = new jsPDF({
    format: [80, 220]
  })
  const empresa = empresaConfig
  const anchoTicket = 80
  let yPos = 5

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
  doc.text(empresa.razonSocial, anchoTicket / 2, yPos, { align: 'center' })

  yPos += 4
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`TEL ${empresa.telefonoPlanta}`, anchoTicket / 2, yPos, { align: 'center' })

  yPos += 3
  doc.text(`Registro Sanitario ${empresa.registroSanitario}`, anchoTicket / 2, yPos, { align: 'center' })

  yPos += 3
  doc.setFont('helvetica', 'bold')
  doc.text(`RUC ${empresa.ruc}`, anchoTicket / 2, yPos, { align: 'center' })

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
  const codigoSede = branchCode || empresa.sedeCode || 'NV'
  // Usar correlativoSede si está disponible, sino usar pedidoId como fallback
  const numeroDocumento = correlativoSede || pedidoId
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
  doc.text(cliente.nombre || '', 22, yPos)

  yPos += 4
  doc.setFont('helvetica', 'bold')
  doc.text('FECHA EMISIÓN:', 5, yPos)
  doc.setFont('helvetica', 'normal')
  const fechaFormateada = fecha instanceof Date
    ? formatearFecha(fecha, 'dd/MM/yyyy')
    : formatearFecha(fecha, 'dd/MM/yyyy')
  doc.text(fechaFormateada, 35, yPos)

  // VENDEDOR (solo si el usuario actual NO es cliente)
  if (user && user.rol !== ROLES.CLIENTE) {
    yPos += 4
    doc.setFont('helvetica', 'bold')
    doc.text('VENDEDOR:', 5, yPos)
    doc.setFont('helvetica', 'normal')
    const rolCapitalizado = user.rol.charAt(0).toUpperCase() + user.rol.slice(1)
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
  items.forEach(item => {
    yPos += 4

    // [Cantidad]
    doc.text(`[${item.cantidad}]`, 5, yPos)

    // Kilos totales
    const kilosPorBolsa = item.kilosPorBolsa || item.presentacion?.kilos || 0
    const kilosTotales = item.cantidad * kilosPorBolsa
    doc.text(`${kilosTotales}kg`, 17, yPos)

    // Descripción del producto (sin los kilos)
    let descripcion = ''
    if (item.nombreProducto) {
      // Viene del carrito
      descripcion = item.nombreProducto
    } else if (item.especie && item.medida) {
      // Viene de detalles expandidos
      descripcion = `${item.especie?.nombre || ''} ${item.medida?.nombre || ''}`
    }
    const descWrapped = doc.splitTextToSize(descripcion, 24)
    doc.text(descWrapped, 28, yPos)

    // Precio unitario
    doc.text(item.precioKg.toFixed(2), 55, yPos)

    // Total
    doc.text(item.subtotal.toFixed(2), anchoTicket - 5, yPos, { align: 'right' })

    yPos += (descWrapped.length - 1) * 3 + 2
  })

  // Línea separadora
  yPos += 3
  doc.line(5, yPos, anchoTicket - 5, yPos)

  // ============================================
  // TOTALES
  // ============================================
  yPos += 4
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('SUBTOTAL S/.:', 5, yPos)
  doc.text(totales.totalMonto.toFixed(2), anchoTicket - 5, yPos, { align: 'right' })

  yPos += 5
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL A PAGAR S/.:', 5, yPos)
  doc.text(totales.totalMonto.toFixed(2), anchoTicket - 5, yPos, { align: 'right' })

  // IMPORTE EN LETRAS
  yPos += 5
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  const totalEnLetras = numeroALetras(totales.totalMonto)
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
  const tipoPagoTexto = TIPOS_PAGO_LABELS[tipoPago] || tipoPago
  doc.text(`Forma de pago: ${tipoPagoTexto}`, anchoTicket / 2, yPos, { align: 'center' })

  // Estado de pago anticipado
  if (pagadoAnticipado) {
    yPos += 4
    doc.setFont('helvetica', 'bold')
    doc.text('*** YA PAGADO ***', anchoTicket / 2, yPos, { align: 'center' })
  }

  // Información de crédito si aplica
  if (tipoPago === TIPOS_PAGO.CREDITO && diasCredito) {
    yPos += 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(`El pago se realizará al: Crédito ${diasCredito} día(s)`, anchoTicket / 2, yPos, { align: 'center' })
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

  // Acciones según opciones
  if (autoSave) {
    const finalFileName = fileName || `NotaVenta_${pedidoId}_${formatearFecha(new Date(), 'ddMMyyyy')}.pdf`
    doc.save(finalFileName)
  }

  if (autoOpen) {
    window.open(doc.output('bloburl'), '_blank')
  }

  return doc
}
