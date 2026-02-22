import { useVentasDiarias } from '@hooks/useVentasDiarias'
import { FiltrosFecha, TablaVentasDiarias, ResumenVentas } from '@components/ReporteVentas'

/**
 * Vista de Reporte de Ventas Diarias
 *
 * Responsabilidad única: Mostrar las ventas agrupadas por producto
 * Permite filtrar por rango de fechas para análisis detallado
 * Integrado con API-062 GET /api/v1/reports/daily-sales
 */
const ReporteVentasDiarias = () => {
  const {
    ventasPorProducto,
    totales,
    fechaInicio,
    fechaFin,
    filtrarPorFechas,
    limpiarFiltros,
    loading
  } = useVentasDiarias()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reporte de Ventas Diarias</h1>
        <p className="text-gray-600 mt-1">
          Análisis detallado de ventas por producto
        </p>
      </div>

      <FiltrosFecha
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        onFiltrar={filtrarPorFechas}
        onLimpiar={limpiarFiltros}
      />

      <ResumenVentas totales={totales} />

      <TablaVentasDiarias
        ventas={ventasPorProducto}
        totales={totales}
        loading={loading}
      />
    </div>
  )
}

export default ReporteVentasDiarias
