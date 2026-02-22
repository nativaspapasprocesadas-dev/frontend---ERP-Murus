import React from 'react'
import { Modal, Button, Badge } from '@components/common'
import { formatearMoneda, formatearFecha } from '@utils/formatters'
import { ESTADOS_PEDIDO_LABELS, ESTADOS_PEDIDO_COLORS } from '@utils/constants'

const ModalCancelar = ({
  isOpen,
  onClose,
  pedido,
  affectedModules,
  onConfirmar
}) => {
  if (!pedido) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar Cancelación de Pedido"
      size="md"
    >
      <div className="space-y-6">
        {/* Alerta principal */}
        <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
          <div className="flex items-start gap-3">
            <span className="text-3xl">⚠️</span>
            <div className="flex-1">
              <h4 className="font-bold text-red-900 text-lg">¿Estás seguro de cancelar este pedido?</h4>
              <p className="text-sm text-red-800 mt-2">
                Esta acción eliminará el pedido de todos los módulos relacionados y no se podrá deshacer.
              </p>
            </div>
          </div>
        </div>

        {/* Detalles del pedido */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="font-semibold text-gray-900 mb-3">Información del Pedido</h5>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">ID:</span>
              <span className="ml-2 font-mono font-medium">#{pedido.id}</span>
            </div>
            <div>
              <span className="text-gray-600">Estado:</span>
              <span className="ml-2">
                <Badge variant={ESTADOS_PEDIDO_COLORS[pedido.estado]}>
                  {ESTADOS_PEDIDO_LABELS[pedido.estado]}
                </Badge>
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Cliente:</span>
              <span className="ml-2 font-medium">{pedido.nombreCliente}</span>
            </div>
            <div>
              <span className="text-gray-600">Total:</span>
              <span className="ml-2 font-bold text-primary-600">
                {formatearMoneda(pedido.totalMonto)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Fecha:</span>
              <span className="ml-2">{formatearFecha(pedido.fecha, 'dd/MM/yyyy HH:mm')}</span>
            </div>
          </div>
        </div>

        {/* Módulos afectados */}
        {affectedModules.length > 0 && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h5 className="font-semibold text-yellow-900 mb-2">Módulos que serán afectados:</h5>
            <ul className="space-y-2 text-sm">
              {affectedModules.includes('produccion') && (
                <li className="flex items-start gap-2">
                  <span className="text-yellow-700">🏭</span>
                  <span className="text-yellow-800">
                    <strong>Producción:</strong> Los productos se eliminarán del checklist de producción
                  </span>
                </li>
              )}
              {affectedModules.includes('rutas') && (
                <li className="flex items-start gap-2">
                  <span className="text-yellow-700">🚚</span>
                  <span className="text-yellow-800">
                    <strong>Rutas:</strong> El pedido se quitará de la ruta asignada (Ruta {pedido.rutaNumero})
                  </span>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            No, mantener pedido
          </Button>
          <Button variant="danger" onClick={onConfirmar}>
            Sí, cancelar pedido
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ModalCancelar
