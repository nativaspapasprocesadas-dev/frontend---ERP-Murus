import { Card, SedeIndicator } from '@components/common'
import { useReportsSummary } from '@hooks/useReportsSummary'
import { formatearMoneda, formatearKilos } from '@utils/formatters'

/**
 * Vista de Reportes - ELM-143
 *
 * Responsabilidad única: Mostrar estadísticas y análisis del negocio
 * Integrado con API-061 GET /api/v1/reports/summary
 * Contiene: ELM-144 (Resumen Ventas), ELM-145 (Top Clientes), ELM-146 (Top Productos), ELM-147 (Estado Cartera)
 */
const Reportes = () => {
  // Hook que consume API-061 - reemplaza useMockPedidos, useMockClientes, useMockMovimientosCredito
  const {
    totalOrders,
    totalKilos,
    totalAmount,
    topClients,
    topProducts,
    portfolioStatus,
    loading
  } = useReportsSummary()

  // Calcular promedios basados en datos reales de API-061
  const promedioKilosPorPedido = totalOrders > 0 ? totalKilos / totalOrders : 0
  const promedioMontoPorPedido = totalOrders > 0 ? totalAmount / totalOrders : 0

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <SedeIndicator size="sm" />
        </div>
        <p className="text-gray-600 mt-1">Análisis y estadísticas del negocio</p>
      </div>

      {/* ELM-144: Resumen de Ventas - Integrado con API-061 */}
      <Card title="📊 Resumen de Ventas">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando resumen...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Pedidos Completados</p>
              <p className="text-2xl font-bold text-blue-600">{totalOrders}</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Kilos</p>
              <p className="text-2xl font-bold text-green-600">
                {formatearKilos(totalKilos)}
              </p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Monto</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatearMoneda(totalAmount)}
              </p>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Promedio Kilos/Pedido</p>
              <p className="text-2xl font-bold text-yellow-600">
                {promedioKilosPorPedido.toFixed(1)} kg
              </p>
            </div>

            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Promedio Monto/Pedido</p>
              <p className="text-2xl font-bold text-pink-600">
                {formatearMoneda(promedioMontoPorPedido)}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* ELM-145: Top 5 Clientes - Integrado con API-061 */}
      <Card title="🏆 Top 5 Clientes">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando top clientes...</div>
        ) : topClients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay clientes con ventas</div>
        ) : (
          <div className="space-y-3">
            {topClients.map((cliente, index) => (
              <div
                key={cliente.id || cliente.name}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{cliente.name}</p>
                    <p className="text-sm text-gray-600">{cliente.ordersCount || 0} pedidos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-primary-600">
                    {formatearMoneda(cliente.totalAmount || 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ELM-146: Top 5 Productos Mas Vendidos - Integrado con API-061 */}
      <Card title="📦 Top 5 Productos Más Vendidos">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando top productos...</div>
        ) : topProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay productos vendidos</div>
        ) : (
          <div className="space-y-3">
            {topProducts.map((producto, index) => (
              <div
                key={producto.id || producto.name}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{producto.name}</p>
                    {producto.code && (
                      <p className="text-sm text-gray-600">Código: {producto.code}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-green-600">{producto.totalQuantity || 0}</p>
                  <p className="text-sm text-gray-600">bolsas</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ELM-147: Estado de Cartera - Integrado con API-061 */}
      <Card title="💳 Estado de Cartera">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando estado de cartera...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Clientes con Deuda</p>
              <p className="text-3xl font-bold text-blue-600">
                {portfolioStatus.customersWithDebt || 0}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {formatearMoneda(portfolioStatus.totalDebt || 0)}
              </p>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
              <p className="text-sm text-gray-600 mb-1">Con Deuda Vencida</p>
              <p className="text-3xl font-bold text-red-600">
                {portfolioStatus.customersWithOverdueDebt || 0}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {formatearMoneda(portfolioStatus.overdueDebt || 0)}
              </p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Total Por Cobrar</p>
              <p className="text-3xl font-bold text-purple-600">
                {formatearMoneda(portfolioStatus.totalDebt || 0)}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                saldo pendiente total
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Nota */}
      <Card>
        <div className="text-center text-gray-600">
          <p className="text-sm">
            💡 Reportes generados en tiempo real desde API-061 con datos de pedidos completados.
          </p>
          <p className="text-sm mt-1">
            Integrado con backend real - Sin datos simulados (mockdata eliminado).
          </p>
        </div>
      </Card>
    </div>
  )
}

export default Reportes
