import { useState, useMemo, useEffect } from 'react'
import { Card, Button, Select, SedeIndicator, DateRangePicker } from '@components/common'
import { getCustomersReport, getCustomerConsumption } from '@services/ReportsService'
import { formatearMoneda, formatearFecha } from '@utils/formatters'
import { getLocalDate, getLocalDateDaysAgo } from '@utils/dateUtils'
import useAuthStore from '@features/auth/useAuthStore'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Vista de Reporte por Clientes
 *
 * Responsabilidad: Generar reportes de clientes con estado de crédito y actividad
 *
 * Elementos integrados:
 * - ELM-132: Vista Reporte por Clientes (vista principal)
 * - ELM-133: Filtros (filtro tipo cliente, filtro deuda)
 * - ELM-135: Resumen General (cards con estadísticas)
 *
 * APIs utilizadas:
 * - API-065: GET /api/v1/reports/customers (reporte de clientes)
 *
 * NOTA: Versión simplificada que usa API-065. La API provee estadísticas
 * de clientes con crédito y actividad básica. El análisis detallado de productos,
 * especies y medidas requeriría APIs adicionales de pedidos no implementadas aún.
 */
const ReporteClientes = () => {
  // Obtener sede activa del store (para SUPERADMINISTRADOR)
  const { sedeIdActiva, getSedeIdParaFiltro } = useAuthStore()

  // Estados de datos
  const [clientes, setClientes] = useState([])
  const [resumen, setResumen] = useState({
    totalCustomers: 0,
    totalDebt: 0,
    overdueDebt: 0,
    activeCustomers: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Estados de filtros (ELM-133)
  const [filtroTipoCliente, setFiltroTipoCliente] = useState('')
  const [filtroDeuda, setFiltroDeuda] = useState('')

  // Estados del Detallado de Consumo por Día (importe consumido y nº de pedidos por día)
  const [consumoFechaInicio, setConsumoFechaInicio] = useState(getLocalDateDaysAgo(30))
  const [consumoFechaFin, setConsumoFechaFin] = useState(getLocalDate())
  const [consumoClientes, setConsumoClientes] = useState([])
  const [consumoResumen, setConsumoResumen] = useState({ totalCustomers: 0, totalImporte: 0, totalPedidos: 0 })
  const [consumoLoading, setConsumoLoading] = useState(false)

  // Cargar datos reales desde API-065 - incluye cambio de sede
  useEffect(() => {
    cargarDatos()
  }, [filtroTipoCliente, filtroDeuda, sedeIdActiva])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)

      // Construir parámetros para API-065
      const params = { pageSize: 1000 }

      // Obtener branchId del selector de sede global
      const branchIdParaFiltro = getSedeIdParaFiltro()
      if (branchIdParaFiltro) {
        params.branchId = branchIdParaFiltro
      }

      if (filtroTipoCliente) {
        params.customerType = filtroTipoCliente
      }

      if (filtroDeuda) {
        params.hasDebt = filtroDeuda === 'con_deuda'
      }

      // Llamar a API-065 GET /api/v1/reports/customers
      const response = await getCustomersReport(params)

      if (response.success) {
        setClientes(response.customers || [])
        setResumen(response.summary || {
          totalCustomers: 0,
          totalDebt: 0,
          overdueDebt: 0,
          activeCustomers: 0
        })
      } else {
        setError(response.error || 'Error al cargar el reporte')
      }
    } catch (err) {
      console.error('Error cargando reporte de clientes:', err)
      setError('Error al cargar el reporte: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Cargar Detallado de Consumo por Día - recarga al cambiar fechas o sede
  useEffect(() => {
    cargarConsumo(consumoFechaInicio, consumoFechaFin)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sedeIdActiva])

  // Carga inicial del consumo
  useEffect(() => {
    cargarConsumo(consumoFechaInicio, consumoFechaFin)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cargarConsumo = async (dateFrom, dateTo) => {
    if (!dateFrom || !dateTo) return

    try {
      setConsumoLoading(true)

      const params = { dateFrom, dateTo }
      const branchIdParaFiltro = getSedeIdParaFiltro()
      if (branchIdParaFiltro) {
        params.branchId = branchIdParaFiltro
      }

      const response = await getCustomerConsumption(params)

      if (response.success) {
        setConsumoClientes(response.customers || [])
        setConsumoResumen(response.summary || { totalCustomers: 0, totalImporte: 0, totalPedidos: 0 })
      } else {
        toast.error(response.error || 'Error al cargar el detallado de consumo')
      }
    } catch (err) {
      console.error('Error cargando detallado de consumo:', err)
      if (err.response?.status === 400) {
        toast.error(err.response.data.error || 'Parámetros inválidos')
      } else {
        toast.error('Error al cargar el detallado de consumo')
      }
    } finally {
      setConsumoLoading(false)
    }
  }

  // Manejar cambio de rango de fechas del detallado de consumo
  const handleConsumoDateRange = ({ startDate, endDate }) => {
    if (startDate && endDate) {
      setConsumoFechaInicio(startDate)
      setConsumoFechaFin(endDate)
      cargarConsumo(startDate, endDate)
    }
  }

  // Exportar Detallado de Consumo por Día a PDF
  const exportarConsumoPDF = () => {
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Detallado de Consumo por Cliente', 105, 20, { align: 'center' })

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Periodo: ${formatearFecha(consumoFechaInicio)} al ${formatearFecha(consumoFechaFin)}`,
      105,
      28,
      { align: 'center' }
    )

    let yPosition = 38

    doc.setFontSize(10)
    doc.text(`Clientes: ${consumoResumen.totalCustomers}`, 20, yPosition)
    doc.text(`Total Pedidos: ${consumoResumen.totalPedidos}`, 80, yPosition)
    doc.text(`Importe Total: ${formatearMoneda(consumoResumen.totalImporte)}`, 140, yPosition)
    yPosition += 8

    // Filas: una por (cliente, día) más subtotal por cliente
    const body = []
    consumoClientes.forEach(cliente => {
      cliente.dias.forEach((d, idx) => {
        body.push([
          idx === 0 ? cliente.name : '',
          formatearFecha(d.dia),
          d.pedidos,
          formatearMoneda(d.importe)
        ])
      })
      body.push([
        { content: `Subtotal ${cliente.name}`, styles: { fontStyle: 'bold' } },
        '',
        { content: String(cliente.totalPedidos), styles: { fontStyle: 'bold' } },
        { content: formatearMoneda(cliente.totalImporte), styles: { fontStyle: 'bold' } }
      ])
    })

    autoTable(doc, {
      startY: yPosition,
      head: [['Cliente', 'Día', 'Pedidos', 'Importe Consumido']],
      body,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 75 },
        1: { cellWidth: 35 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 45, halign: 'right' }
      }
    })

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

    doc.save(`detallado-consumo-clientes-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`)
  }

  // Estadísticas totales (ELM-135 - Resumen General)
  const estadisticasTotales = useMemo(() => {
    return {
      totalClientes: resumen.totalCustomers || 0,
      totalDeuda: resumen.totalDebt || 0,
      deudaVencida: resumen.overdueDebt || 0,
      clientesConDeuda: resumen.customersWithDebt || clientes.filter(c => (c.totalDebt || 0) > 0).length,
      clientesActivos: resumen.activeCustomers || 0,
      promedioDeudaPorCliente: resumen.totalCustomers > 0
        ? (resumen.totalDebt || 0) / resumen.totalCustomers
        : 0
    }
  }, [clientes, resumen])

  // Exportar a PDF
  const exportarPDF = () => {
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Reporte por Clientes', 105, 20, { align: 'center' })

    // Fecha de generación
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Fecha de generación: ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}`,
      105,
      28,
      { align: 'center' }
    )

    let yPosition = 36

    // Resumen general
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumen General', 20, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total Clientes: ${estadisticasTotales.totalClientes}`, 20, yPosition)
    doc.text(`Clientes Activos: ${estadisticasTotales.clientesActivos}`, 80, yPosition)
    doc.text(`Total Deuda: ${formatearMoneda(estadisticasTotales.totalDeuda)}`, 140, yPosition)
    yPosition += 6
    doc.text(`Deuda Vencida: ${formatearMoneda(estadisticasTotales.deudaVencida)}`, 20, yPosition)
    doc.text(`Clientes con Deuda: ${estadisticasTotales.clientesConDeuda}`, 80, yPosition)
    yPosition += 10

    // Tabla resumen por cliente
    const resumenData = clientes.map(cliente => [
      cliente.name || 'Sin nombre',
      formatearMoneda(cliente.totalDebt || 0),
      cliente.ordersCompleted || 0,
      cliente.lastOrderDate ? formatearFecha(cliente.lastOrderDate) : '-'
    ])

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Detalle por Cliente', 20, yPosition)
    yPosition += 6

    autoTable(doc, {
      startY: yPosition,
      head: [['Cliente', 'Deuda Total', 'Pedidos', 'Último Pedido']],
      body: resumenData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 40 }
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

    doc.save(`reporte-clientes-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Reporte por Clientes</h1>
          <SedeIndicator size="sm" />
        </div>
        <p className="text-gray-600 mt-1">Consumo detallado por cliente: especies, cortes, kilos y montos</p>
      </div>

      {/* Filtros (ELM-133) */}
      <Card title="📅 Filtros">
        {loading && <p className="text-gray-500 mb-4">Cargando...</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Tipo de Cliente"
            value={filtroTipoCliente}
            onChange={(e) => setFiltroTipoCliente(e.target.value)}
            options={[
              { value: '', label: 'Todos los tipos' },
              { value: 'RECURRENTE', label: 'Recurrente' },
              { value: 'NO_RECURRENTE', label: 'No Recurrente' }
            ]}
            disabled={loading}
          />

          <Select
            label="Estado de Deuda"
            value={filtroDeuda}
            onChange={(e) => setFiltroDeuda(e.target.value)}
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'con_deuda', label: 'Con Deuda' },
              { value: 'sin_deuda', label: 'Sin Deuda' }
            ]}
            disabled={loading}
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={exportarPDF} variant="primary" disabled={loading || clientes.length === 0}>
            📄 Exportar PDF
          </Button>
        </div>
      </Card>

      {/* Estadísticas Totales (ELM-135 - Resumen General) */}
      <Card title="📊 Resumen General">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Clientes</p>
            <p className="text-3xl font-bold text-blue-600">{estadisticasTotales.totalClientes}</p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <p className="text-sm text-gray-600 mb-1">Activos</p>
            <p className="text-3xl font-bold text-green-600">{estadisticasTotales.clientesActivos}</p>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
            <p className="text-sm text-gray-600 mb-1">Total Deuda</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatearMoneda(estadisticasTotales.totalDeuda)}
            </p>
          </div>

          <div className="text-center p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
            <p className="text-sm text-gray-600 mb-1">Deuda Vencida</p>
            <p className="text-2xl font-bold text-yellow-600">
              {formatearMoneda(estadisticasTotales.deudaVencida)}
            </p>
          </div>

          <div className="text-center p-4 bg-pink-50 rounded-lg border-2 border-pink-200">
            <p className="text-sm text-gray-600 mb-1">Con Deuda</p>
            <p className="text-3xl font-bold text-pink-600">{estadisticasTotales.clientesConDeuda}</p>
            <p className="text-xs text-gray-500 mt-1">clientes</p>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
            <p className="text-sm text-gray-600 mb-1">Promedio Deuda</p>
            <p className="text-2xl font-bold text-orange-600">
              {formatearMoneda(estadisticasTotales.promedioDeudaPorCliente)}
            </p>
            <p className="text-xs text-gray-500 mt-1">por cliente</p>
          </div>
        </div>
      </Card>

      {/* Detallado de Consumo por Día (importe consumido y nº de pedidos por día) */}
      <Card title="📈 Detallado de Consumo por Cliente">
        <p className="text-gray-600 text-sm mb-4">
          Importe total consumido por día y cantidad de pedidos realizados por cada cliente en el periodo seleccionado.
        </p>

        {/* Filtro de rango de fechas */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
          <div className="w-full sm:w-auto sm:min-w-[320px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rango de Fechas</label>
            <DateRangePicker
              startDate={consumoFechaInicio}
              endDate={consumoFechaFin}
              onChange={handleConsumoDateRange}
              maxDays={90}
              placeholder="Seleccionar rango de fechas..."
            />
          </div>
          <div className="flex-1" />
          <Button
            onClick={exportarConsumoPDF}
            variant="primary"
            disabled={consumoLoading || consumoClientes.length === 0}
          >
            📄 Exportar PDF
          </Button>
        </div>

        {/* Resumen del consumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Clientes con Consumo</p>
            <p className="text-3xl font-bold text-blue-600">{consumoResumen.totalCustomers}</p>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
            <p className="text-sm text-gray-600 mb-1">Total Pedidos</p>
            <p className="text-3xl font-bold text-indigo-600">{consumoResumen.totalPedidos}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <p className="text-sm text-gray-600 mb-1">Importe Total Consumido</p>
            <p className="text-2xl font-bold text-green-600">{formatearMoneda(consumoResumen.totalImporte)}</p>
          </div>
        </div>

        {consumoLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando detallado de consumo...</p>
          </div>
        )}

        {!consumoLoading && consumoClientes.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay consumo registrado en el periodo seleccionado</p>
          </div>
        )}

        {/* Tabla por cliente con desglose diario */}
        {!consumoLoading && consumoClientes.length > 0 && (
          <div className="space-y-6">
            {consumoClientes.map((cliente) => (
              <div key={cliente.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <p className="font-semibold text-gray-900">👤 {cliente.name}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      Pedidos: <span className="font-bold text-indigo-600">{cliente.totalPedidos}</span>
                    </span>
                    <span className="text-gray-600">
                      Total: <span className="font-bold text-green-600">{formatearMoneda(cliente.totalImporte)}</span>
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Día</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-700">Pedidos</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-700">Importe Consumido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cliente.dias.map((d) => (
                        <tr key={d.dia} className="border-t border-gray-100">
                          <td className="px-4 py-2 text-gray-800">{formatearFecha(d.dia)}</td>
                          <td className="px-4 py-2 text-center text-gray-800">{d.pedidos}</td>
                          <td className="px-4 py-2 text-right text-gray-800">{formatearMoneda(d.importe)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                        <td className="px-4 py-2 text-gray-900">Total</td>
                        <td className="px-4 py-2 text-center text-indigo-600">{cliente.totalPedidos}</td>
                        <td className="px-4 py-2 text-right text-green-600">{formatearMoneda(cliente.totalImporte)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Listado de Clientes (ELM-132) */}
      {!loading && clientes.length > 0 && (
        <>
          {clientes.map((cliente) => (
            <Card key={cliente.id} title={`👤 ${cliente.name || 'Sin nombre'}`}>
              <div className="space-y-4">
                {/* Información básica del cliente */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium">{cliente.phone || '-'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Tipo de Cliente</p>
                    <p className="font-medium">{cliente.customerType || '-'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Dirección</p>
                    <p className="font-medium">{cliente.address || '-'}</p>
                  </div>
                </div>

                {/* Resumen del cliente */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Pedidos Completados</p>
                    <p className="text-2xl font-bold text-blue-600">{cliente.ordersCompleted || 0}</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Deuda Total</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatearMoneda(cliente.totalDebt || 0)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Deuda Vencida</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatearMoneda(cliente.overdueDebt || 0)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Último Pedido</p>
                    <p className="text-lg font-bold text-green-600">
                      {cliente.lastOrderDate ? formatearFecha(cliente.lastOrderDate) : 'Sin pedidos'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </>
      )}

      {/* Mensaje si está cargando */}
      {loading && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Cargando datos...</p>
          </div>
        </Card>
      )}

      {/* Mensaje si no hay datos */}
      {!loading && clientes.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No hay datos para mostrar
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Intenta ajustar los filtros o verifica que existan clientes en el sistema
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}

export default ReporteClientes
