import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatearMoneda, formatearFecha } from '@utils/formatters'

/**
 * Paleta de colores MURU'S (extraída del logo)
 */
const COLORES_MURUS = {
  naranja: [232, 93, 4],       // #E85D04 - Texto "Muru's"
  amarillo: [244, 168, 32],    // #F4A820 - Papas fritas doradas
  marron: [139, 105, 20],      // #8B6914 - Papa/chullo
  magenta: [233, 30, 140],     // #E91E8C - Chullo
  negro: [26, 26, 26],         // #1A1A1A - Contornos
  fondoClaro: [255, 250, 240], // #FFFAF0 - Fondo cálido
  grisOscuro: [60, 60, 60],
  grisClaro: [120, 120, 120]
}

/**
 * Genera PDF completo de ruta (con direcciones, teléfonos - paleta MURU'S)
 *
 * @param {Object} params
 * @param {Object} params.ruta - Datos de la ruta
 * @param {Array} params.pedidos - Lista de pedidos de la ruta
 * @param {Object} params.colores - Colores por número de ruta
 * @param {Object} params.labels - Labels para estados
 * @param {Object} params.empresaConfig - Configuración de empresa (REQUERIDO)
 * @returns {jsPDF} Documento PDF generado
 */
export const generarRutaPDFCompleto = ({
  ruta,
  pedidos,
  colores,
  labels,
  empresaConfig
}) => {
  if (!empresaConfig) {
    console.error('RutaPDFCompleto: empresaConfig es requerido')
    throw new Error('Configuración de empresa no disponible')
  }

  const doc = new jsPDF()
  const empresa = empresaConfig
  const colorRuta = colores[ruta.numero] || '#F4A820'
  const pageWidth = doc.internal.pageSize.width

  let yPos = 15

  // ============================================
  // ENCABEZADO CON LOGO
  // ============================================

  // Fondo del encabezado
  doc.setFillColor(...COLORES_MURUS.fondoClaro)
  doc.rect(0, 0, pageWidth, 50, 'F')

  // Barra superior naranja
  doc.setFillColor(...COLORES_MURUS.naranja)
  doc.rect(0, 0, pageWidth, 4, 'F')

  // Logo
  try {
    doc.addImage('/logoPapas.png', 'PNG', 15, 10, 35, 35)
  } catch (error) {
    console.error('Error al cargar logo:', error)
  }

  // Información de la empresa
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORES_MURUS.naranja)
  doc.text(empresa.nombreComercial || 'MURU\'S', 55, 20)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORES_MURUS.grisOscuro)
  doc.text(empresa.razonSocial, 55, 27)
  doc.text(`RUC: ${empresa.ruc}  |  Tel: ${empresa.telefonoPlanta}`, 55, 33)

  // Título del documento
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORES_MURUS.marron)
  doc.text('REPORTE DE RUTA', pageWidth - 15, 18, { align: 'right' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORES_MURUS.grisClaro)
  doc.text('Información Completa', pageWidth - 15, 25, { align: 'right' })

  // Línea divisoria con color de ruta
  const rgbColor = hexToRgb(colorRuta)
  doc.setDrawColor(...rgbColor)
  doc.setLineWidth(2.5)
  doc.line(15, 48, pageWidth - 15, 48)

  yPos = 58

  // ============================================
  // INFORMACIÓN DE LA RUTA
  // ============================================

  // Caja de información principal
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...COLORES_MURUS.amarillo)
  doc.setLineWidth(1)
  doc.roundedRect(15, yPos, pageWidth - 30, 32, 3, 3, 'FD')

  // Indicador de color de ruta
  doc.setFillColor(...rgbColor)
  doc.circle(25, yPos + 16, 6, 'F')

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORES_MURUS.naranja)
  doc.text(`${labels[ruta.numero]}`, 35, yPos + 14)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORES_MURUS.grisOscuro)
  doc.text(formatearFecha(ruta.fecha, 'dd/MM/yyyy'), 35, yPos + 24)

  // Estadísticas en cajas - TODAS DEL MISMO TAMAÑO
  const cardWidth = 18
  const cardGap = 3
  const cardHeight = 20

  // Ancho total de las 3 tarjetas + gaps
  const totalCardsWidth = (cardWidth * 3) + (cardGap * 2)
  // Centrar en la mitad derecha de la página (después de la info de ruta)
  const cardsStartX = pageWidth / 2 + 10

  // Posiciones calculadas desde el inicio centrado
  const pedidosCardX = cardsStartX
  const kilosCardX = pedidosCardX + cardWidth + cardGap
  const totalCardX = kilosCardX + cardWidth + cardGap

  // Card: Pedidos
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...COLORES_MURUS.amarillo)
  doc.setLineWidth(0.5)
  doc.roundedRect(pedidosCardX, yPos + 4, cardWidth, cardHeight, 2, 2, 'FD')
  doc.setFontSize(7)
  doc.setTextColor(...COLORES_MURUS.grisClaro)
  doc.text('Pedidos', pedidosCardX + cardWidth / 2, yPos + 10, { align: 'center' })
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORES_MURUS.naranja)
  doc.text(`${pedidos.length}`, pedidosCardX + cardWidth / 2, yPos + 19, { align: 'center' })

  // Card: Kilos
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(kilosCardX, yPos + 4, cardWidth, cardHeight, 2, 2, 'FD')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORES_MURUS.grisClaro)
  doc.text('Kilos', kilosCardX + cardWidth / 2, yPos + 10, { align: 'center' })
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORES_MURUS.marron)
  doc.text(`${ruta.totalKilos}`, kilosCardX + cardWidth / 2, yPos + 19, { align: 'center' })

  // Card: Monto (mismo tamaño que las otras)
  doc.setFillColor(...COLORES_MURUS.naranja)
  doc.setDrawColor(...COLORES_MURUS.naranja)
  doc.roundedRect(totalCardX, yPos + 4, cardWidth, cardHeight, 2, 2, 'FD')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.text('Total', totalCardX + cardWidth / 2, yPos + 10, { align: 'center' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(formatearMoneda(ruta.totalMonto), totalCardX + cardWidth / 2, yPos + 19, { align: 'center' })

  yPos += 40

  // ============================================
  // TABLA DE PEDIDOS
  // ============================================

  const rows = pedidos.map((p, index) => {
    let estadoPago = (p.tipoPago || 'PENDIENTE').toUpperCase()
    if (p.pagadoAnticipado) {
      estadoPago = 'PAGADO'
    }

    return [
      `${index + 1}`,
      p.nombreCliente || p.clienteNombre || 'Sin nombre',
      p.direccionCliente || p.clienteDireccion || '-',
      p.telefonoCliente || p.clienteTelefono || '-',
      `${p.totalKilos || 0} kg`,
      formatearMoneda(p.totalMonto || 0),
      estadoPago
    ]
  })

  autoTable(doc, {
    head: [['#', 'Cliente', 'Dirección', 'Teléfono', 'Kilos', 'Monto', 'Pago']],
    body: rows,
    startY: yPos,
    styles: {
      fontSize: 8,
      cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
      lineColor: [230, 230, 230],
      lineWidth: 0.1,
      textColor: COLORES_MURUS.grisOscuro
    },
    headStyles: {
      fillColor: COLORES_MURUS.naranja,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [255, 252, 248]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold', textColor: COLORES_MURUS.naranja },
      1: { cellWidth: 35, fontStyle: 'bold' },
      2: { cellWidth: 45 },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 18, halign: 'center', textColor: COLORES_MURUS.marron },
      5: { cellWidth: 25, halign: 'right', fontStyle: 'bold', textColor: COLORES_MURUS.naranja },
      6: { cellWidth: 22, halign: 'center' }
    },
    didParseCell: (data) => {
      // PAGADO en verde
      if (data.column.index === 6 && data.cell.raw === 'PAGADO') {
        data.cell.styles.textColor = [34, 139, 34]
        data.cell.styles.fontStyle = 'bold'
      }
      // CREDITO en naranja
      if (data.column.index === 6 && data.cell.raw === 'CREDITO') {
        data.cell.styles.textColor = COLORES_MURUS.naranja
      }
      // CONTADO en marrón
      if (data.column.index === 6 && data.cell.raw === 'CONTADO') {
        data.cell.styles.textColor = COLORES_MURUS.marron
      }
    },
    margin: { left: 15, right: 15, bottom: 25 }
  })

  // ============================================
  // RESUMEN FINAL
  // ============================================
  const finalY = (doc.lastAutoTable?.finalY || yPos) + 10

  if (finalY < doc.internal.pageSize.height - 50) {
    // Caja de resumen
    doc.setFillColor(...COLORES_MURUS.fondoClaro)
    doc.setDrawColor(...COLORES_MURUS.amarillo)
    doc.setLineWidth(1)
    doc.roundedRect(pageWidth - 95, finalY, 80, 28, 3, 3, 'FD')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORES_MURUS.marron)
    doc.text('TOTAL RUTA', pageWidth - 90, finalY + 10)

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORES_MURUS.naranja)
    doc.text(formatearMoneda(ruta.totalMonto), pageWidth - 20, finalY + 12, { align: 'right' })

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORES_MURUS.grisClaro)
    doc.text(`${pedidos.length} pedidos  •  ${ruta.totalKilos} kg`, pageWidth - 90, finalY + 22)
  }

  // ============================================
  // PIE DE PÁGINA
  // ============================================
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Barra inferior naranja
    doc.setFillColor(...COLORES_MURUS.naranja)
    doc.rect(0, doc.internal.pageSize.height - 8, pageWidth, 8, 'F')

    // Línea divisoria
    doc.setDrawColor(...COLORES_MURUS.amarillo)
    doc.setLineWidth(0.5)
    doc.line(15, doc.internal.pageSize.height - 18, pageWidth - 15, doc.internal.pageSize.height - 18)

    // Texto del pie
    doc.setFontSize(8)
    doc.setTextColor(...COLORES_MURUS.grisClaro)
    doc.text(
      `${empresa.nombreComercial} - Frescas y Listas para freír`,
      15,
      doc.internal.pageSize.height - 12
    )
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 12,
      { align: 'center' }
    )
    doc.text(
      formatearFecha(new Date().toISOString(), 'dd/MM/yyyy HH:mm'),
      pageWidth - 15,
      doc.internal.pageSize.height - 12,
      { align: 'right' }
    )
  }

  // Usar nombre de ruta (sanitizado) o numero como fallback para el nombre del archivo
  const nombreRuta = (ruta.nombre || labels[ruta.numero] || `Ruta_${ruta.numero || ruta.id}`)
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '')
    .replace(/\s+/g, '_')
  doc.save(`Ruta_Completa_${nombreRuta}_${formatearFecha(ruta.fecha, 'ddMMyyyy')}.pdf`)
}

// Utilidad para convertir hex a RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : COLORES_MURUS.amarillo
}
