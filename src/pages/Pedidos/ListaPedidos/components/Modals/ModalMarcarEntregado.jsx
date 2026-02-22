import React from 'react'
import { Modal, Button } from '@components/common'
import { formatearMoneda } from '@utils/formatters'

const TipoPagoButton = ({ tipo, label, icon, descripcion, selected, onClick, disabled, title }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`p-4 border-2 rounded-lg text-center transition-colors ${
      disabled
        ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300'
        : selected
        ? tipo === 'contado'
          ? 'border-green-600 bg-green-50 text-green-900'
          : tipo === 'credito'
          ? 'border-orange-600 bg-orange-50 text-orange-900'
          : 'border-blue-600 bg-blue-50 text-blue-900'
        : 'border-gray-200 hover:border-gray-300'
    }`}
    title={title}
  >
    <div className="text-2xl mb-1">{icon}</div>
    <div className="font-semibold">{label}</div>
    <div className="text-xs text-gray-600">{descripcion}</div>
  </button>
)

const ModalMarcarEntregado = ({
  isOpen,
  onClose,
  pedido,
  pagoFormData,
  aceptarExcedente,
  onChangeTipoPago,
  onChangeMontoContado,
  onChangeMontoCredito,
  onChangeAceptarExcedente,
  onConfirmar
}) => {
  if (!pedido) return null

  const cliente = pedido.cliente
  const diasCreditoCliente = cliente?.diasCredito || 0
  const noTieneCredito = diasCreditoCliente === 0
  const montoCredito = parseFloat(pagoFormData.montoCredito) || 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cerrar Venta - Marcar como Entregado"
      size="lg"
    >
      <div className="space-y-6">
        {/* Información del pedido */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Información del Pedido</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
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
              <span className="text-gray-600">Deuda actual:</span>
              <span className="ml-2 font-medium text-red-600">
                {formatearMoneda(cliente?.totalDeuda || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Selector de tipo de pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de Pago
          </label>

          {/* Alerta si cliente NO es recurrente */}
          {noTieneCredito && (
            <div className="mb-4 p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-orange-900">Cliente No Recurrente</p>
                  <p className="text-sm text-orange-800 mt-1">
                    Este cliente solo puede pagar al contado. No tiene días de crédito configurados.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <TipoPagoButton
              tipo="contado"
              label="Contado"
              icon="💵"
              descripcion="100% al contado"
              selected={pagoFormData.tipoPago === 'contado'}
              onClick={() => onChangeTipoPago('contado')}
            />
            <TipoPagoButton
              tipo="credito"
              label="Crédito"
              icon="💳"
              descripcion={diasCreditoCliente > 0 ? '100% a crédito' : 'No disponible'}
              selected={pagoFormData.tipoPago === 'credito'}
              onClick={() => onChangeTipoPago('credito')}
              disabled={noTieneCredito}
              title={noTieneCredito ? 'Cliente no recurrente - solo contado' : ''}
            />
            <TipoPagoButton
              tipo="mixto"
              label="Mixto"
              icon="🔀"
              descripcion={diasCreditoCliente > 0 ? 'Contado + Crédito' : 'No disponible'}
              selected={pagoFormData.tipoPago === 'mixto'}
              onClick={() => onChangeTipoPago('mixto')}
              disabled={noTieneCredito}
              title={noTieneCredito ? 'Cliente no recurrente - solo contado' : ''}
            />
          </div>
        </div>

        {/* Formulario de montos */}
        <div className="space-y-4">
          {(pagoFormData.tipoPago === 'contado' || pagoFormData.tipoPago === 'mixto') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto al Contado
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={pagoFormData.montoContado}
                onChange={(e) => onChangeMontoContado(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}

          {(pagoFormData.tipoPago === 'credito' || pagoFormData.tipoPago === 'mixto') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto a Crédito
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={pagoFormData.montoCredito}
                  onChange={(e) => onChangeMontoCredito(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días de Crédito (configurados para este cliente)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={pagoFormData.diasCredito}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Los días de crédito se configuran en la ficha del cliente
                </p>
              </div>
            </>
          )}

          {/* Resumen */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h5 className="font-semibold text-blue-900 mb-2">Resumen del Pago</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total del pedido:</span>
                <span className="font-bold">{formatearMoneda(pedido.totalMonto)}</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span>Contado:</span>
                <span className="font-semibold">{formatearMoneda(pagoFormData.montoContado)}</span>
              </div>
              <div className="flex justify-between text-orange-700">
                <span>Crédito:</span>
                <span className="font-semibold">{formatearMoneda(pagoFormData.montoCredito)}</span>
              </div>
              <div className="border-t border-blue-300 pt-1 mt-2 flex justify-between font-bold">
                <span>Total pagos:</span>
                <span>
                  {formatearMoneda(
                    parseFloat(pagoFormData.montoContado) + parseFloat(pagoFormData.montoCredito)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onConfirmar}>
            Confirmar Entrega
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ModalMarcarEntregado
