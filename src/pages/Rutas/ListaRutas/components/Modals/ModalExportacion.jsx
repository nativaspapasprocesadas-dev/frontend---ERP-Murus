import React from 'react'
import { Modal, Button, Badge } from '@components/common'
import { formatearMoneda, formatearFecha } from '@utils/formatters'

const ModalExportacion = ({
  isOpen,
  onClose,
  ruta,
  pedidos,
  pedidosConMonto,
  chofer,
  colores,
  labels,
  onToggleMonto,
  onExportarRepartidor,
  onExportarCompleto,
  onImprimirTicket
}) => {
  if (!ruta) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Exportar Ruta para Repartidor"
      size="xl"
    >
      <div className="space-y-6">
        {/* Información de la ruta */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-lg text-blue-900 mb-2">
            {labels[ruta.numero]} - {formatearFecha(ruta.fecha, 'dd/MM/yyyy')}
          </h3>

          {/* Información del conductor */}
          {chofer && (
            <div className="mb-3 pb-3 border-b border-blue-200">
              <div className="flex items-center gap-2">
                <span className="text-blue-700 font-medium">Conductor:</span>
                <span className="font-semibold text-blue-900">{chofer.nombre}</span>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  Lic: {chofer.licencia}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Total Pedidos:</span>
              <span className="ml-2 font-semibold">{pedidos.length}</span>
            </div>
            <div>
              <span className="text-blue-700">Total Monto:</span>
              <span className="ml-2 font-semibold">{formatearMoneda(ruta.totalMonto)}</span>
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-amber-50 p-3 rounded border border-amber-200">
          <p className="text-sm text-amber-900">
            <strong>Instrucciones:</strong> Selecciona qué pedidos mostrarán el monto en el PDF del repartidor.
            El PDF NO incluirá direcciones ni teléfonos, solo el nombre del restaurante y los productos.
          </p>
        </div>

        {/* Lista de pedidos con checkboxes */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <h4 className="font-semibold text-gray-900">Vista Previa de Pedidos:</h4>

          {pedidos.map((pedido, index) => (
            <div key={pedido.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-start gap-3">
                {/* Checkbox para mostrar monto */}
                <div className="flex items-center pt-1">
                  <input
                    type="checkbox"
                    id={`pedido-${pedido.id}`}
                    checked={pedidosConMonto[pedido.id] || false}
                    onChange={() => onToggleMonto(pedido.id)}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500 cursor-pointer"
                  />
                </div>

                {/* Información del pedido */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor={`pedido-${pedido.id}`} className="font-semibold text-gray-900 cursor-pointer">
                      {index + 1}. {pedido.nombreCliente}
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="info"
                        onClick={(e) => {
                          e.stopPropagation()
                          onImprimirTicket(pedido)
                        }}
                        title="Imprimir Ticket"
                      >
                        🖨️ Ticket
                      </Button>
                      {pedidosConMonto[pedido.id] ? (
                        <Badge variant="success">Con Monto</Badge>
                      ) : (
                        <Badge variant="gray">Sin Monto</Badge>
                      )}
                    </div>
                  </div>

                  {/* Productos - Vista con 3 columnas */}
                  <div className="mt-2 ml-4">
                    <div className="grid grid-cols-[2fr_1fr_2fr] gap-3 text-sm">
                      <div className="font-medium text-gray-600">Descripción</div>
                      <div className="font-medium text-gray-600 text-center">Kilos</div>
                      <div className="font-medium text-gray-600">Cantidad de Bolsas</div>
                    </div>
                    <div className="border-t border-gray-200 mt-1 pt-1">
                      {(() => {
                        // Agrupar productos
                        const productosAgrupados = {}
                        const detalles = pedido.detalles || pedido.items || []

                        if (detalles.length === 0) {
                          return <div className="text-gray-500 text-sm italic">Sin detalles disponibles</div>
                        }

                        detalles.forEach(detalle => {
                          // Manejar diferentes estructuras de datos
                          const especieNombre = detalle.especie?.nombre || detalle.species || detalle.producto?.especie || 'Sin especie'
                          const medidaNombre = detalle.medida?.nombre || detalle.measure || detalle.producto?.medida || ''
                          const descripcion = `${especieNombre} ${medidaNombre}`.trim()
                          const kilosBolsa = detalle.presentacion?.kilos || detalle.kilos || detalle.quantity || 1
                          const cantidad = detalle.cantidad || detalle.quantity || 1
                          const totalKilos = cantidad * kilosBolsa

                          if (!productosAgrupados[descripcion]) {
                            productosAgrupados[descripcion] = {
                              totalKilos: 0,
                              bolsas: []
                            }
                          }

                          productosAgrupados[descripcion].totalKilos += totalKilos
                          productosAgrupados[descripcion].bolsas.push({ cantidad, kilosBolsa })
                        })

                        return Object.entries(productosAgrupados).map(([descripcion, data], idx) => (
                          <div key={idx} className="grid grid-cols-[2fr_1fr_2fr] gap-3 text-sm py-1 border-b border-gray-100 last:border-0">
                            <div className="text-gray-900">{descripcion}</div>
                            <div className="text-gray-700 text-center font-semibold">{data.totalKilos} kg</div>
                            <div className="text-gray-700">
                              {data.bolsas.map((b, i) => (
                                <div key={i}>
                                  {b.cantidad} bolsa{b.cantidad > 1 ? 's' : ''} de {b.kilosBolsa} kg
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>

                  {/* Mostrar monto si está habilitado */}
                  {pedidosConMonto[pedido.id] && (
                    <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                      <span className="text-sm font-semibold text-green-800">
                        TOTAL: {formatearMoneda(pedido.totalMonto)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 justify-between pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onExportarCompleto}>
              📋 Exportar Completo
            </Button>
            <Button variant="primary" onClick={onExportarRepartidor}>
              🚚 Exportar para Repartidor
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ModalExportacion
