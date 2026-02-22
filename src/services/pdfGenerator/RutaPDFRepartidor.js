import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatearMoneda, formatearFecha } from '@utils/formatters'

const COLORES_MURUS = {
  naranja: [232, 93, 4],
  amarillo: [244, 168, 32],
  marron: [139, 105, 20],
  negro: [26, 26, 26],
  fondoClaro: [255, 250, 240],
  grisOscuro: [60, 60, 60],
  grisClaro: [120, 120, 120]
}

/**
 * Dibuja la marca de agua del logo centrada en la página actual
 */
function dibujarMarcaDeAgua(doc) {
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const logoSize = 130
  const x = (pageWidth - logoSize) / 2
  const y = (pageHeight - logoSize) / 2

  try {
    doc.saveGraphicsState()
    doc.setGState(new doc.GState({ opacity: 0.08 }))
    doc.addImage('/logoPapas.png', 'PNG', x, y, logoSize, logoSize)
    doc.restoreGraphicsState()
  } catch (error) {
    console.error('Error al dibujar marca de agua:', error)
  }
}

/**
 * Genera PDF de ruta para repartidor (formato compacto, optimizado para 30+ filas)
 *
 * @param {Object} params
 * @param {Object} params.ruta - Datos de la ruta
 * @param {Array} params.pedidos - Lista de pedidos de la ruta
 * @param {boolean} params.pedidosConMonto - Si se muestran montos en el PDF
 * @param {Object} params.chofer - Datos del chofer
 * @param {Object} params.colores - Colores por número de ruta
 * @param {Object} params.labels - Labels para estados
 * @param {Object} params.empresaConfig - Configuración de empresa (REQUERIDO)
 * @returns {jsPDF} Documento PDF generado
 */
export const generarRutaPDFRepartidor = ({
  ruta,
  pedidos,
  pedidosConMonto,
  chofer,
  colores,
  labels,
  empresaConfig
}) => {
  if (!empresaConfig) {
    console.error('RutaPDFRepartidor: empresaConfig es requerido')
    throw new Error('Configuración de empresa no disponible')
  }

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height

  // ============================================
  // LÍNEA ÚNICA DE INFORMACIÓN DE RUTA
  // ============================================

  let yPos = 12
  let cursorX = 15

  // Nombre de ruta (bold, naranja)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORES_MURUS.naranja)
  const nombreRutaTexto = labels[ruta.numero] || ruta.nombre || `Ruta ${ruta.id}`
  doc.text(nombreRutaTexto, cursorX, yPos)
  cursorX += doc.getTextWidth(nombreRutaTexto) + 3

  // Separador
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORES_MURUS.grisClaro)
  doc.text('|', cursorX, yPos)
  cursorX += 5

  // Fecha de la ruta
  doc.setTextColor(...COLORES_MURUS.grisOscuro)
  const fechaTexto = formatearFecha(ruta.fecha, 'dd/MM/yyyy')
  doc.text(fechaTexto, cursorX, yPos)
  cursorX += doc.getTextWidth(fechaTexto) + 3

  // Conductor (si existe)
  if (chofer) {
    doc.setTextColor(...COLORES_MURUS.grisClaro)
    doc.text('|', cursorX, yPos)
    cursorX += 5

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORES_MURUS.marron)
    const nombreChofer = chofer.nombre.length > 22 ? chofer.nombre.substring(0, 22) + '...' : chofer.nombre
    doc.text(nombreChofer, cursorX, yPos)
    cursorX += doc.getTextWidth(nombreChofer) + 2

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORES_MURUS.grisClaro)
    doc.text(`(${chofer.licencia})`, cursorX, yPos)
  }

  // Línea separadora sutil
  doc.setDrawColor(...COLORES_MURUS.amarillo)
  doc.setLineWidth(0.3)
  doc.line(15, yPos + 3, pageWidth - 15, yPos + 3)

  yPos += 6

  // ============================================
  // TABLA DE PEDIDOS (compacta)
  // ============================================

  const rows = []

  pedidos.forEach((pedido, index) => {
    const productosAgrupados = {}

    pedido.detalles.forEach(detalle => {
      const descripcion = `${detalle.especie.nombre} ${detalle.medida.nombre}`
      const kilosBolsa = detalle.presentacion.kilos
      const cantidad = detalle.cantidad
      const totalKilos = cantidad * kilosBolsa

      if (!productosAgrupados[descripcion]) {
        productosAgrupados[descripcion] = {
          descripcion,
          totalKilos: 0,
          bolsas: []
        }
      }

      productosAgrupados[descripcion].totalKilos += totalKilos
      productosAgrupados[descripcion].bolsas.push({ cantidad, kilosBolsa })
    })

    const descripciones = []
    const kilos = []
    const bolsas = []

    Object.values(productosAgrupados).forEach(grupo => {
      descripciones.push(grupo.descripcion)
      kilos.push(`${grupo.totalKilos} kg`)
      bolsas.push(grupo.bolsas.map(b => `${b.cantidad} x ${b.kilosBolsa}kg`).join(', '))
    })

    let montoText = '-'
    if (pedido.pagadoAnticipado) {
      montoText = 'PAGADO'
    } else if (pedidosConMonto[pedido.id]) {
      montoText = formatearMoneda(pedido.totalMonto)
    }

    rows.push([
      `${index + 1}`,
      pedido.nombreCliente,
      descripciones.join('\n'),
      kilos.join('\n'),
      bolsas.join('\n'),
      montoText,
      ''
    ])
  })

  autoTable(doc, {
    head: [['#', 'Cliente', 'Producto', 'Kilos', 'Bolsas', 'Monto', 'Obs.']],
    body: rows,
    startY: yPos,
    styles: {
      fontSize: 7,
      cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
      lineColor: [230, 230, 230],
      lineWidth: 0.1,
      textColor: COLORES_MURUS.grisOscuro
    },
    headStyles: {
      fillColor: COLORES_MURUS.naranja,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [255, 252, 248]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold', textColor: COLORES_MURUS.naranja },
      1: { cellWidth: 35, fontStyle: 'bold' },
      2: { cellWidth: 30 },
      3: { cellWidth: 18, halign: 'center', textColor: COLORES_MURUS.marron },
      4: { cellWidth: 28 },
      5: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 37, fillColor: [255, 250, 240] }
    },
    didParseCell: (data) => {
      if (data.column.index === 5 && data.cell.raw === 'PAGADO') {
        data.cell.styles.textColor = [34, 139, 34]
        data.cell.styles.fontStyle = 'bold'
      }
      if (data.column.index === 5 && data.cell.raw && data.cell.raw.includes('S/.')) {
        data.cell.styles.textColor = COLORES_MURUS.naranja
      }
    },
    margin: { left: 15, right: 15, bottom: 20 }
  })

  // ============================================
  // MARCA DE AGUA + PIE DE PÁGINA (todas las páginas)
  // ============================================

  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Marca de agua del logo
    dibujarMarcaDeAgua(doc)

    // Línea separadora del pie
    doc.setDrawColor(...COLORES_MURUS.amarillo)
    doc.setLineWidth(0.3)
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15)

    // Solo la fecha de la ruta
    doc.setFontSize(8)
    doc.setTextColor(...COLORES_MURUS.grisClaro)
    doc.text(
      formatearFecha(ruta.fecha, 'dd/MM/yyyy HH:mm'),
      pageWidth - 15,
      pageHeight - 10,
      { align: 'right' }
    )
  }

  // Guardar PDF
  const nombreRuta = (ruta.nombre || labels[ruta.numero] || `Ruta_${ruta.numero || ruta.id}`)
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '')
    .replace(/\s+/g, '_')
  doc.save(`Ruta_Repartidor_${nombreRuta}_${formatearFecha(ruta.fecha, 'ddMMyyyy')}.pdf`)
}
