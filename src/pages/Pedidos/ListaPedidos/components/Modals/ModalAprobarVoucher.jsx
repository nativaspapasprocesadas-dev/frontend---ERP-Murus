import React, { useState } from 'react'
import { Modal, Button, Badge } from '@components/common'
import { formatearMoneda, formatearFecha } from '@utils/formatters'
import { ESTADOS_PAGO_LABELS, ESTADOS_PAGO_COLORS } from '@utils/constants'

/**
 * Modal para visualizar y aprobar/rechazar vouchers de pago
 * Integrado en la seccion de Pedidos para gestionar pagos pendientes
 */
const ModalAprobarVoucher = ({
  isOpen,
  onClose,
  pedido,
  loading,
  onAprobar,
  onRechazar
}) => {
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [showRechazoForm, setShowRechazoForm] = useState(false)
  const [errorRechazo, setErrorRechazo] = useState('')

  if (!pedido) return null

  const handleAprobar = () => {
    onAprobar(pedido.id)
  }

  const handleMostrarRechazo = () => {
    setShowRechazoForm(true)
    setMotivoRechazo('')
    setErrorRechazo('')
  }

  const handleCancelarRechazo = () => {
    setShowRechazoForm(false)
    setMotivoRechazo('')
    setErrorRechazo('')
  }

  const handleConfirmarRechazo = () => {
    if (!motivoRechazo || motivoRechazo.trim().length < 5) {
      setErrorRechazo('El motivo del rechazo debe tener al menos 5 caracteres')
      return
    }
    onRechazar(pedido.id, motivoRechazo.trim())
    setShowRechazoForm(false)
    setMotivoRechazo('')
  }

  const handleClose = () => {
    setShowRechazoForm(false)
    setMotivoRechazo('')
    setErrorRechazo('')
    onClose()
  }

  // Construir URL completa del voucher
  const getVoucherFullUrl = () => {
    if (!pedido.voucherUrl) return null
    // Si ya es una URL completa, usarla directamente
    if (pedido.voucherUrl.startsWith('http')) {
      return pedido.voucherUrl
    }
    // Si es ruta relativa, construir URL completa
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4020'
    return `${baseUrl}${pedido.voucherUrl}`
  }

  const voucherFullUrl = getVoucherFullUrl()

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Verificar Voucher de Pago"
      size="lg"
    >
      <div className="space-y-6">
        {/* Informacion del pedido */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="font-semibold text-gray-900 mb-3">Informacion del Pedido</h5>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Pedido:</span>
              <span className="ml-2 font-mono font-bold">#{pedido.numero || pedido.id}</span>
            </div>
            <div>
              <span className="text-gray-600">Estado Pago:</span>
              <span className="ml-2">
                <Badge variant={ESTADOS_PAGO_COLORS[pedido.estadoPago] || 'warning'}>
                  {ESTADOS_PAGO_LABELS[pedido.estadoPago] || 'Pendiente'}
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
                {formatearMoneda(pedido.totalMonto || pedido.total)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Fecha:</span>
              <span className="ml-2">{formatearFecha(pedido.fecha, 'dd/MM/yyyy HH:mm')}</span>
            </div>
          </div>
        </div>

        {/* Visualizacion del voucher */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-blue-50 px-4 py-2 border-b">
            <h5 className="font-semibold text-blue-900">Voucher de Pago</h5>
          </div>
          <div className="p-4 flex justify-center bg-gray-100 min-h-[300px]">
            {voucherFullUrl ? (
              <div className="relative">
                <img
                  src={voucherFullUrl}
                  alt="Voucher de pago"
                  className="max-w-full max-h-[400px] object-contain rounded shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(voucherFullUrl, '_blank')}
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
                <div
                  className="hidden flex-col items-center justify-center p-8 bg-white rounded shadow"
                  style={{ display: 'none' }}
                >
                  <span className="text-4xl mb-2">📄</span>
                  <p className="text-gray-600 mb-3">No se pudo cargar la imagen</p>
                  <a
                    href={voucherFullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Abrir archivo en nueva pestana
                  </a>
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">
                  Clic en la imagen para ampliar
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <span className="text-5xl mb-3">📎</span>
                <p>No hay voucher adjunto</p>
              </div>
            )}
          </div>
        </div>

        {/* Formulario de rechazo */}
        {showRechazoForm && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h5 className="font-semibold text-red-900 mb-3">Motivo del Rechazo</h5>
            <textarea
              value={motivoRechazo}
              onChange={(e) => {
                setMotivoRechazo(e.target.value)
                if (errorRechazo) setErrorRechazo('')
              }}
              placeholder="Ingresa el motivo del rechazo (minimo 5 caracteres)..."
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={3}
            />
            {errorRechazo && (
              <p className="text-sm text-red-600 mt-1">{errorRechazo}</p>
            )}
            <div className="flex gap-2 mt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancelarRechazo}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmarRechazo}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Confirmar Rechazo'}
              </Button>
            </div>
          </div>
        )}

        {/* Botones de accion */}
        {!showRechazoForm && pedido.estadoPago === 'PENDIENTE' && (
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={handleClose}>
              Cerrar
            </Button>
            <Button
              variant="danger"
              onClick={handleMostrarRechazo}
              disabled={loading}
            >
              Rechazar Pago
            </Button>
            <Button
              variant="success"
              onClick={handleAprobar}
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Aprobar Pago'}
            </Button>
          </div>
        )}

        {/* Si ya fue procesado, solo mostrar cerrar */}
        {pedido.estadoPago !== 'PENDIENTE' && (
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={handleClose}>
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default ModalAprobarVoucher
