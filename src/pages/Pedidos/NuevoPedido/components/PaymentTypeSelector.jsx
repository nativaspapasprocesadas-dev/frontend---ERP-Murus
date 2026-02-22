import React from 'react'
import { Card, Badge } from '@components/common'
import { TIPOS_PAGO, TIPOS_PAGO_LABELS, TIPO_CLIENTE, TIPO_CLIENTE_LABELS } from '@utils/constants'
import { formatearFecha } from '@utils/formatters'

const PaymentTypeSelector = ({
  tipoPagoSeleccionado,
  setTipoPagoSeleccionado,
  diasCreditoPersonalizados,
  setDiasCreditoPersonalizados,
  pagadoAnticipado,
  setPagadoAnticipado,
  cliente,
  puedeUsarCredito
}) => {
  // Determinar tipo de cliente
  const esClienteRecurrente = cliente?.tipoCliente === TIPO_CLIENTE.RECURRENTE

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Tipo de Pago</h3>
        {cliente && (
          <Badge variant={esClienteRecurrente ? 'success' : 'warning'}>
            {TIPO_CLIENTE_LABELS[cliente.tipoCliente] || 'Cliente'}
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {/* Cliente RECURRENTE: mostrar solo información de crédito automático */}
        {esClienteRecurrente ? (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <span className="text-blue-600 text-2xl">💳</span>
              <div>
                <p className="font-semibold text-blue-900">
                  {TIPOS_PAGO_LABELS[TIPOS_PAGO.CREDITO]}
                </p>
                <p className="text-sm text-blue-700">
                  Como cliente recurrente, tu pedido se registra automáticamente a crédito.
                </p>
              </div>
            </div>

            {/* Información de días de crédito */}
            <div className="mt-3 p-3 bg-white rounded border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Días de crédito: <span className="text-blue-600 font-bold">{cliente?.diasCredito || 15} días</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Fecha de vencimiento: {
                      (() => {
                        const fecha = new Date()
                        fecha.setDate(fecha.getDate() + (cliente?.diasCredito || 15))
                        return formatearFecha(fecha, 'dd/MM/yyyy')
                      })()
                    }
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-blue-600 mt-2">
              El administrador registrará tus pagos posteriormente.
            </p>
          </div>
        ) : (
          // Cliente NO_RECURRENTE: mostrar solo contado (sin opcion de cambiar)
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span className="text-green-600 text-xl">💵</span>
            <div>
              <p className="font-semibold text-gray-900">{TIPOS_PAGO_LABELS[TIPOS_PAGO.CONTADO]}</p>
              <p className="text-sm text-gray-600">Pago único al momento de la entrega o anticipado con voucher</p>
            </div>
          </div>
        )}

      </div>
    </Card>
  )
}

export default PaymentTypeSelector
