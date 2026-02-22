import { useState, useMemo, useEffect } from 'react'
import { Card, Button, Select, SedeIndicator } from '@components/common'
import { getCustomersReport } from '@services/ReportsService'
import { formatearMoneda, formatearFecha } from '@utils/formatters'
import useAuthStore from '@features/auth/useAuthStore'
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
