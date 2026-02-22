import React from 'react'
import { Modal, Button, WhatsAppButton } from '@components/common'

const ModalAlertaModificacion = ({
  isOpen,
  onClose,
  whatsappMensaje
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Información Importante"
      size="md"
    >
      <div className="space-y-6">
        {/* Alerta principal */}
        <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-300">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-10 h-10 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-orange-900 font-bold text-xl mb-3">
                Modificaciones de Pedido
              </h4>
              <p className="text-orange-800 text-base leading-relaxed">
                Cualquier modificación, comunicarse con administración
              </p>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <p className="text-sm text-blue-900">
                Para realizar cambios en su pedido (cantidad, productos, fecha de entrega, etc.),
                por favor contacte con nuestro equipo de administración.
              </p>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 justify-end">
          <WhatsAppButton mensaje={whatsappMensaje} variant="inline" />
          <Button variant="primary" onClick={onClose}>
            Entendido
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ModalAlertaModificacion
