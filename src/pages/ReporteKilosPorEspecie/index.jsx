import { useState, useMemo, useEffect } from 'react'
import { Card, Button, Select, SedeIndicator } from '@components/common'
import { getKilosBySpeciesReport } from '@services/ReportsService'
import { formatearKilos, formatearFecha } from '@utils/formatters'
import useAuthStore from '@features/auth/useAuthStore'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { getLocalDate, dateToLocalString } from '@utils/dateUtils'

/**
 * Vista de Reporte de Kilos por Especie por Día - ELM-137 y ELM-139 (Tabla Detalle por Dia)
 *
 * Responsabilidad única: Generar reportes de cantidad de kilos por especie agrupados por día
 * Permite ver el desglose diario de producción/ventas por tipo de papa
 *
 * Integrado con: API-064 GET /api/v1/reports/kilos-by-species
 */
const ReporteKilosPorEspecie = () => {
  // Obtener sede activa del store (para SUPERADMINISTRADOR)
  const { sedeIdActiva, getSedeIdParaFiltro } = useAuthStore()

  // Datos directamente de API-064 (ya vienen agregados por especie y opcionalmente por día)
  const [datosAPI, setDatosAPI] = useState({ totalKilos: 0, totalOrders: 0, bySpecies: [], byDate: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [filtroFecha, setFiltroFecha] = useState('hoy')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  // Cargar datos reales desde API-064 - incluye cambio de sede
  useEffect(() => {
    const cargarDatos = async () => {
      const rango = getRangoFechas()
      if (!rango.inicio || !rango.fin) return

      try {
        setLoading(true)
        setError(null)

        // Obtener branchId del selector de sede global
        const branchIdParaFiltro = getSedeIdParaFiltro()

        const params = {
          dateFrom: rango.inicio,
          dateTo: rango.fin,
          groupByDate: true  // Solicitar desglose por día para la tabla de detalle
        }
        if (branchIdParaFiltro) {
          params.branchId = branchIdParaFiltro
        }

        // Llamar a API-064 GET /api/v1/reports/kilos-by-species
        const response = await getKilosBySpeciesReport(params)

        // API-064 retorna: { success, totalKilos, totalOrders, bySpecies, byDate (si groupByDate=true) }
        if (response.success) {
          setDatosAPI({
            totalKilos: response.totalKilos || 0,
            totalOrders: response.totalOrders || 0,
            bySpecies: response.bySpecies || [],
            byDate: response.byDate || []  // Datos desglosados por día
          })
        }
      } catch (err) {
        console.error('Error cargando reporte de kilos por especie:', err)
        setError(err.message || 'Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [filtroFecha, fechaInicio, fechaFin, sedeIdActiva])

  // Validar que una fecha string sea completa y válida (yyyy-MM-dd con año >= 2000)
  const esFechaValida = (dateStr) => {
    if (!dateStr || dateStr.length !== 10) return false
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!match) return false
    const year = parseInt(match[1], 10)
    return year >= 2000 && year <= 2100
  }

  // Obtener rango de fechas según filtro
  // IMPORTANTE: Usa getLocalDate() y dateToLocalString() para consistencia de timezone
  const getRangoFechas = () => {
    const hoy = new Date()

    switch (filtroFecha) {
      case 'hoy':
        // Usar getLocalDate() para evitar problemas de timezone
        return {
          inicio: getLocalDate(),
          fin: getLocalDate()
        }
      case 'esta_semana':
        // Usar dateToLocalString() para convertir fechas de date-fns a formato local
        return {
          inicio: dateToLocalString(startOfWeek(hoy, { weekStartsOn: 1 })),
          fin: dateToLocalString(endOfWeek(hoy, { weekStartsOn: 1 }))
        }
      case 'este_mes':
        return {
          inicio: dateToLocalString(startOfMonth(hoy)),
          fin: dateToLocalString(endOfMonth(hoy))
        }
      case 'personalizado':
        if (!esFechaValida(fechaInicio) || !esFechaValida(fechaFin)) return { inicio: '', fin: '' }
        return {
          inicio: fechaInicio,
          fin: fechaFin
        }
      default:
        return { inicio: '', fin: '' }
    }
  }

  // API-064 ya retorna datos agregados, simplificamos el procesamiento
  // especiesUnicas extraída de bySpecies
  const especiesUnicas = useMemo(() => {
    return datosAPI.bySpecies.map(e => e.species).sort()
  }, [datosAPI.bySpecies])

  // Estadísticas totales (directo de API)
  const estadisticasTotales = useMemo(() => {
    const porEspecie = {}
    datosAPI.bySpecies.forEach(e => {
      porEspecie[e.species] = e.kilos
    })

    return {
      totalKilos: datosAPI.totalKilos,
      totalPedidos: datosAPI.totalOrders,
      diasConDatos: datosAPI.bySpecies.length > 0 ? 1 : 0,
      porEspecie
    }
  }, [datosAPI])

  // datosPorDia - Procesa datos de byDate agrupados por fecha
  // API-064 con groupByDate=true retorna: [{fecha, especieId, especie, kilos, pedidos}]
  const datosPorDia = useMemo(() => {
    // Si no hay datos por día, mostrar datos agregados como único registro
    if (!datosAPI.byDate || datosAPI.byDate.length === 0) {
      if (datosAPI.bySpecies.length === 0) return []

      const rango = getRangoFechas()
      return [{
        fecha: rango.inicio || getLocalDate(),
        especies: estadisticasTotales.porEspecie,
        totalKilos: datosAPI.totalKilos,
        totalPedidos: datosAPI.totalOrders
      }]
    }

    // Agrupar datos por fecha
    const datosPorFecha = {}
    datosAPI.byDate.forEach(item => {
      const fechaStr = item.fecha ? (typeof item.fecha === 'string' ? item.fecha.split('T')[0] : dateToLocalString(new Date(item.fecha))) : 'Sin fecha'

      if (!datosPorFecha[fechaStr]) {
        datosPorFecha[fechaStr] = {
          fecha: fechaStr,
          especies: {},
          totalKilos: 0,
          totalPedidos: item.pedidos || 0  // Usar pedidos del primer registro (es el mismo para toda la fecha)
        }
      }

      datosPorFecha[fechaStr].especies[item.especie] = (datosPorFecha[fechaStr].especies[item.especie] || 0) + (item.kilos || 0)
      datosPorFecha[fechaStr].totalKilos += item.kilos || 0
      // El conteo de pedidos es el mismo para todos los registros del mismo día
      if (item.pedidos && item.pedidos > datosPorFecha[fechaStr].totalPedidos) {
        datosPorFecha[fechaStr].totalPedidos = item.pedidos
      }
    })

    // Convertir a array y ordenar por fecha descendente
    return Object.values(datosPorFecha)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  }, [datosAPI.byDate, datosAPI.bySpecies, datosAPI.totalKilos, datosAPI.totalOrders, estadisticasTotales.porEspecie, filtroFecha, fechaInicio, fechaFin])

  // Exportar a PDF
  const exportarPDF = () => {
    const doc = new jsPDF()
    const rango = getRangoFechas()

    // Título
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Reporte de Kilos por Especie', 105, 20, { align: 'center' })

    // Período
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    const periodo = filtroFecha === 'hoy' ? 'Hoy' :
      filtroFecha === 'esta_semana' ? 'Esta Semana' :
        filtroFecha === 'este_mes' ? 'Este Mes' :
          `${formatearFecha(rango.inicio)} - ${formatearFecha(rango.fin)}`
    doc.text(`Período: ${periodo}`, 105, 28, { align: 'center' })

    let yPosition = 36

    // Resumen general
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumen General', 20, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total de Kilos: ${formatearKilos(estadisticasTotales.totalKilos)}`, 20, yPosition)
    doc.text(`Total de Pedidos: ${estadisticasTotales.totalPedidos}`, 100, yPosition)
    yPosition += 6
    doc.text(`Días con Datos: ${estadisticasTotales.diasConDatos}`, 20, yPosition)
    yPosition += 10

    // Total por especie
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Total por Especie', 20, yPosition)
    yPosition += 6

    const especiesData = Object.entries(estadisticasTotales.porEspecie).map(([especie, kilos]) => [
      especie,
      formatearKilos(kilos),
      `${((kilos / estadisticasTotales.totalKilos) * 100).toFixed(1)}%`
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['Especie', 'Kilos', '% del Total']],
      body: especiesData,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94], fontSize: 10 },
      styles: { fontSize: 9 }
    })

    yPosition = doc.lastAutoTable.finalY + 10

    // Tabla detallada por día
    if (yPosition > 240) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Detalle por Día', 20, yPosition)
    yPosition += 6

    // Preparar datos para la tabla
    const headers = ['Fecha', 'Pedidos', ...especiesUnicas, 'Total Kilos']
    const rows = datosPorDia
      .filter(dia => dia.totalKilos > 0)
      .map(dia => {
        const row = [
          formatearFecha(dia.fecha),
          dia.totalPedidos.toString()
        ]

        especiesUnicas.forEach(especie => {
          const kilos = dia.especies[especie] || 0
          row.push(kilos > 0 ? formatearKilos(kilos) : '-')
        })

        row.push(formatearKilos(dia.totalKilos))
        return row
      })

    autoTable(doc, {
      startY: yPosition,
      head: [headers],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
      styles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 15, halign: 'center' }
      }
    })

    // Pie de página
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(128)
      doc.text(
        `Página ${i} de ${pageCount} - Generado el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}`,
        105,
        290,
        { align: 'center' }
      )
    }

    doc.save(`reporte-kilos-especie-${getLocalDate()}.pdf`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reporte de Kilos por Especie</h1>
        <p className="text-gray-600 mt-1">Cantidad de kilos de papa por especie</p>
      </div>

      {/* Filtros */}
      <Card title="📅 Filtros">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Período"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            options={[
              { value: 'hoy', label: 'Hoy' },
              { value: 'esta_semana', label: 'Esta Semana' },
              { value: 'este_mes', label: 'Este Mes' },
              { value: 'personalizado', label: 'Personalizado' }
            ]}
          />

          {filtroFecha === 'personalizado' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={exportarPDF} variant="primary" disabled={datosPorDia.length === 0}>
            📄 Exportar PDF
          </Button>
        </div>
      </Card>

      {/* Estadísticas Totales */}
      <Card title="📊 Resumen General">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Total de Kilos</p>
            <p className="text-3xl font-bold text-blue-600">
              {formatearKilos(estadisticasTotales.totalKilos)}
            </p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <p className="text-sm text-gray-600 mb-1">Total de Pedidos</p>
            <p className="text-3xl font-bold text-green-600">{estadisticasTotales.totalPedidos}</p>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
            <p className="text-sm text-gray-600 mb-1">Días con Datos</p>
            <p className="text-3xl font-bold text-purple-600">{estadisticasTotales.diasConDatos}</p>
          </div>
        </div>
      </Card>

      {/* Total por Especie */}
      {Object.keys(estadisticasTotales.porEspecie).length > 0 && (
        <Card title="🥔 Total por Especie">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(estadisticasTotales.porEspecie)
              .sort((a, b) => b[1] - a[1])
              .map(([especie, kilos]) => {
                const porcentaje = ((kilos / estadisticasTotales.totalKilos) * 100).toFixed(1)
                return (
                  <div
                    key={especie}
                    className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200"
                  >
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{especie}</h3>
                    <p className="text-3xl font-bold text-orange-600 mb-1">
                      {formatearKilos(kilos)}
                    </p>
                    <p className="text-sm text-gray-600">{porcentaje}% del total</p>
                  </div>
                )
              })}
          </div>
        </Card>
      )}

      {/* Detalle por Día */}
      {datosPorDia.filter(d => d.totalKilos > 0).length > 0 && (
        <Card title="📅 Detalle por Día">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Pedidos
                  </th>
                  {especiesUnicas.map(especie => (
                    <th
                      key={especie}
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"
                    >
                      {especie}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total Kilos
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {datosPorDia
                  .filter(dia => dia.totalKilos > 0)
                  .map((dia, index) => (
                    <tr key={dia.fecha} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatearFecha(dia.fecha)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900">
                        {dia.totalPedidos}
                      </td>
                      {especiesUnicas.map(especie => (
                        <td
                          key={especie}
                          className="px-4 py-3 text-sm text-right text-gray-900"
                        >
                          {dia.especies[especie]
                            ? formatearKilos(dia.especies[especie])
                            : '-'}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                        {formatearKilos(dia.totalKilos)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Mensaje si no hay datos */}
      {datosPorDia.filter(d => d.totalKilos > 0).length === 0 && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No hay datos para el período seleccionado
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Intenta ajustar los filtros para ver información
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}

export default ReporteKilosPorEspecie
