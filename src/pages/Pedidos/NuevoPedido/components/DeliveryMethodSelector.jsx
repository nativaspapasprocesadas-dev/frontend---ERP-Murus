import React from 'react'
import { Card, WhatsAppButton } from '@components/common'
import { ROLES } from '@utils/constants'

/**
 * Componente para seleccionar método de entrega
 *
 * OPCIONES DISPONIBLES:
 * - Taxi/Delivery Externo: Siempre visible
 * - Delivery Propio (Ruta): Solo admin/coordinador
 * - Recojo en Planta: Siempre visible
 * - Agendar para mañana: Solo visible cuando la ruta ya salió (rutaYaSalio=true)
 * - Otro: Siempre visible
 */
const DeliveryMethodSelector = ({
  metodoEntrega,
  setMetodoEntrega,
  metodoEntregaOtro,
  setMetodoEntregaOtro,
  isRole,
  whatsappMensajeRutaSalida,
  rutaYaSalio = false
}) => {
  // Calcular fecha de mañana para mostrar en la UI
  const fechaManana = React.useMemo(() => {
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    return manana.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
  }, [])
  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Método de Entrega</h3>

      <div className="space-y-3">
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="metodoEntrega"
              value="taxi"
              checked={metodoEntrega === 'taxi'}
              onChange={(e) => setMetodoEntrega(e.target.value)}
              className="w-4 h-4 text-primary-600"
            />
            <span className="font-medium">🚕 Taxi/Delivery Externo</span>
          </label>

          {/* Delivery Propio solo para admin/coordinador */}
          {!isRole(ROLES.CLIENTE) && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="metodoEntrega"
                value="delivery"
                checked={metodoEntrega === 'delivery'}
                onChange={(e) => setMetodoEntrega(e.target.value)}
                className="w-4 h-4 text-primary-600"
              />
              <span className="font-medium">🚚 Delivery Propio (Ruta)</span>
            </label>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="metodoEntrega"
              value="recojo"
              checked={metodoEntrega === 'recojo'}
              onChange={(e) => setMetodoEntrega(e.target.value)}
              className="w-4 h-4 text-primary-600"
            />
            <span className="font-medium">🏪 Recojo en Planta</span>
          </label>

          {/* Opción: Agendar para mañana - Solo visible cuando la ruta ya salió */}
          {rutaYaSalio && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="metodoEntrega"
                value="agendar_manana"
                checked={metodoEntrega === 'agendar_manana'}
                onChange={(e) => setMetodoEntrega(e.target.value)}
                className="w-4 h-4 text-primary-600"
              />
              <span className="font-medium">📅 Agendar para mañana</span>
            </label>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="metodoEntrega"
              value="otro"
              checked={metodoEntrega === 'otro'}
              onChange={(e) => setMetodoEntrega(e.target.value)}
              className="w-4 h-4 text-primary-600"
            />
            <span className="font-medium">➕ Otro</span>
          </label>
        </div>

        {/* Alerta VERDE cuando se selecciona Agendar para mañana */}
        {metodoEntrega === 'agendar_manana' && (
          <div className="mt-3 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-green-900 font-bold text-base mb-2">
                  📅 Pedido programado para mañana
                </h4>
                <p className="text-green-800 text-sm leading-relaxed">
                  Tu pedido será incluido en la ruta de <strong>{fechaManana}</strong> y será entregado en el horario habitual de tu zona.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerta ROJA cuando se selecciona Taxi/Delivery Externo (solo para clientes) */}
        {metodoEntrega === 'taxi' && isRole(ROLES.CLIENTE) && (
          <div className="mt-3 p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-red-900 font-bold text-base mb-2">
                  ⚠️ IMPORTANTE
                </h4>
                <p className="text-red-800 text-sm leading-relaxed mb-3">
                  El pedido será enviado por un transporte particular, se le estará comentando el precio de envío.
                </p>
                <WhatsAppButton mensaje={whatsappMensajeRutaSalida} variant="inline" />
              </div>
            </div>
          </div>
        )}

        {/* Campo de texto cuando se selecciona "Otro" */}
        {metodoEntrega === 'otro' && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-300">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Especificar método de entrega <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={metodoEntregaOtro}
              onChange={(e) => setMetodoEntregaOtro(e.target.value)}
              placeholder="Ej: Mototaxi, Courier, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              maxLength={100}
            />
            {metodoEntrega === 'otro' && !metodoEntregaOtro && (
              <p className="text-sm text-amber-600 mt-1">
                ⚠️ Debes especificar el método de entrega
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export default DeliveryMethodSelector
