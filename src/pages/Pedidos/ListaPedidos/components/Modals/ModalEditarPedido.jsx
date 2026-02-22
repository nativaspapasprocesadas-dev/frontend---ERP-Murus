import React from 'react'
import { Modal, Button, Badge } from '@components/common'
import { formatearMoneda, formatearKilos } from '@utils/formatters'
import { ESTADOS_PEDIDO_LABELS, ESTADOS_PEDIDO_COLORS } from '@utils/constants'

const ModalEditarPedido = ({
  isOpen,
  onClose,
  pedido,
  detallesEditados,
  onChangeCantidad,
  onEliminarDetalle,
  onConfirmar
}) => {
  if (!pedido) return null

  const nuevoTotalKilos = detallesEditados.reduce(
    (sum, d) => sum + (d.cantidad * d.kilosPorBolsa), 0
  )
  const nuevoTotalMonto = detallesEditados.reduce(
    (sum, d) => sum + d.subtotal, 0
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Pedido"
      size="lg"
    >
      <div className="space-y-6">
        {/* Información del pedido */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Pedido:</span>
              <span className="ml-2 font-mono font-medium">#{pedido.id}</span>
            </div>
            <div>
              <span className="text-gray-600">Cliente:</span>
              <span className="ml-2 font-medium">{pedido.nombreCliente}</span>
            </div>
            <div>
              <span className="text-gray-600">Estado:</span>
              <span className="ml-2">
                <Badge variant={ESTADOS_PEDIDO_COLORS[pedido.estado]}>
                  {ESTADOS_PEDIDO_LABELS[pedido.estado]}
                </Badge>
              </span>
            </div>
          </div>
        </div>

        {/* Lista de productos editables */}
        <div>
          <h5 className="font-semibold text-gray-900 mb-3">Productos del Pedido</h5>
          <div className="space-y-3">
            {detallesEditados.map((detalle) => (
              <div key={detalle.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{detalle.nombreProducto}</p>
                    <p className="text-sm text-gray-600">
                      {detalle.kilosPorBolsa} kg/bolsa • {formatearMoneda(detalle.precioKg)}/kg
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-600 mb-1">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={detalle.cantidad}
                        onChange={(e) => onChangeCantidad(detalle.id, e.target.value)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-600 mb-1">Subtotal</label>
                      <span className="font-bold text-primary-600">
                        {formatearMoneda(detalle.subtotal)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onEliminarDetalle(detalle.id)}
                      title="Eliminar producto"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
                {detalle.cantidad !== detalle.cantidadOriginal && (
                  <div className="mt-2 text-xs text-orange-600">
                    ⚠️ Cantidad original: {detalle.cantidadOriginal} bolsas
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Totales actualizados */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h5 className="font-semibold text-green-900 mb-2">Totales Actualizados</h5>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Total Kilos:</span>
              <span className="font-bold text-gray-900">
                {formatearKilos(nuevoTotalKilos)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Total Monto:</span>
              <span className="font-bold text-primary-600">
                {formatearMoneda(nuevoTotalMonto)}
              </span>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onConfirmar}>
            Guardar Cambios
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ModalEditarPedido
