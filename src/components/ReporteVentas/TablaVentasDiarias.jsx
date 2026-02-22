import { formatearMoneda, formatearKilos, formatearNumero } from '@utils/formatters'
import { tablaVentasStyles } from './styles'

/**
 * Componente para mostrar la tabla de ventas diarias por producto
 */
export const TablaVentasDiarias = ({ ventas, totales, loading }) => {
  if (loading) {
    return (
      <div className={tablaVentasStyles.container}>
        <div className={tablaVentasStyles.emptyState}>
          <p className={tablaVentasStyles.emptyStateText}>Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (!ventas || ventas.length === 0) {
    return (
      <div className={tablaVentasStyles.container}>
        <div className={tablaVentasStyles.emptyState}>
          <p className={tablaVentasStyles.emptyStateText}>
            No hay ventas registradas en el período seleccionado
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={tablaVentasStyles.container}>
      <div className={tablaVentasStyles.header}>
        <h2 className={tablaVentasStyles.title}>Ventas por Producto</h2>
      </div>

      <div className={tablaVentasStyles.tableWrapper}>
        <table className={tablaVentasStyles.table}>
          <thead className={tablaVentasStyles.thead}>
            <tr className={tablaVentasStyles.theadRow}>
              <th className={tablaVentasStyles.th}>#</th>
              <th className={tablaVentasStyles.th}>Producto</th>
              <th className={tablaVentasStyles.thRight}>Bolsas</th>
              <th className={tablaVentasStyles.thRight}>Total Kilos</th>
              <th className={tablaVentasStyles.thRight}>Precio Prom/Kg</th>
              <th className={tablaVentasStyles.thRight}>Total Monto</th>
              <th className={tablaVentasStyles.thRight}>N° Pedidos</th>
            </tr>
          </thead>
          <tbody className={tablaVentasStyles.tbody}>
            {ventas.map((venta, index) => (
              <tr key={venta.productoId} className={tablaVentasStyles.tr}>
                <td className={tablaVentasStyles.td}>
                  <span className="font-medium text-gray-500">{index + 1}</span>
                </td>
                <td className={tablaVentasStyles.td}>
                  <div className={tablaVentasStyles.productoContainer}>
                    {venta.fotoUrl ? (
                      <img
                        src={venta.fotoUrl}
                        alt={venta.nombreProducto}
                        className={tablaVentasStyles.productoImagen}
                      />
                    ) : (
                      <div className={`${tablaVentasStyles.productoImagen} flex items-center justify-center`}>
                        <span className="text-gray-400 text-xs">Sin foto</span>
                      </div>
                    )}
                    <div className={tablaVentasStyles.productoInfo}>
                      <span className={tablaVentasStyles.productoNombre}>
                        {venta.nombreProducto}
                      </span>
                      <span className={tablaVentasStyles.productoDetalle}>
                        {venta.especie} · {venta.medida} · {venta.presentacion}kg
                      </span>
                    </div>
                  </div>
                </td>
                <td className={tablaVentasStyles.tdRight}>
                  <span className="font-medium">{formatearNumero(venta.cantidadBolsas)}</span>
                </td>
                <td className={tablaVentasStyles.tdRight}>
                  <span className="font-semibold text-blue-600">
                    {formatearKilos(venta.totalKilos)}
                  </span>
                </td>
                <td className={tablaVentasStyles.tdRight}>
                  <span className="text-gray-600">
                    {formatearMoneda(venta.precioPromedioKg)}
                  </span>
                </td>
                <td className={tablaVentasStyles.tdRight}>
                  <span className="font-semibold text-green-600">
                    {formatearMoneda(venta.totalMonto)}
                  </span>
                </td>
                <td className={tablaVentasStyles.tdRight}>
                  <span className={`${tablaVentasStyles.badge} ${tablaVentasStyles.badgePrimary}`}>
                    {venta.cantidadPedidos}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totales && (
        <div className={tablaVentasStyles.footer}>
          <div className={tablaVentasStyles.footerGrid}>
            <div className={tablaVentasStyles.footerItem}>
              <span className={tablaVentasStyles.footerLabel}>Total Productos</span>
              <span className={tablaVentasStyles.footerValue}>
                {formatearNumero(totales.totalProductos)}
              </span>
            </div>
            <div className={tablaVentasStyles.footerItem}>
              <span className={tablaVentasStyles.footerLabel}>Total Bolsas</span>
              <span className={tablaVentasStyles.footerValue}>
                {formatearNumero(totales.totalBolsas)}
              </span>
            </div>
            <div className={tablaVentasStyles.footerItem}>
              <span className={tablaVentasStyles.footerLabel}>Total Kilos</span>
              <span className={tablaVentasStyles.footerValue}>
                {formatearKilos(totales.totalKilos)}
              </span>
            </div>
            <div className={tablaVentasStyles.footerItem}>
              <span className={tablaVentasStyles.footerLabel}>Total Monto</span>
              <span className={tablaVentasStyles.footerValue}>
                {formatearMoneda(totales.totalMonto)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

