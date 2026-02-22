import React from 'react'
import { Modal, Button } from '@components/common'
import { RUTAS } from '@utils/constants'

const ModalAsignarRuta = ({
  isOpen,
  onClose,
  rutaSeleccionada,
  onRutaChange,
  onConfirmar
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Pedido a Ruta"
    >
      <div className="space-y-4">
        <p className="text-gray-600">
          Selecciona la ruta a la que deseas asignar este pedido:
        </p>

        <div className="space-y-2">
          {[RUTAS.RUTA_1, RUTAS.RUTA_2, RUTAS.RUTA_3].map((ruta) => (
            <label
              key={ruta}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                rutaSeleccionada === ruta.toString()
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <input
                type="radio"
                name="ruta"
                value={ruta}
                checked={rutaSeleccionada === ruta.toString()}
                onChange={(e) => onRutaChange(e.target.value)}
                className="mr-3"
              />
              <div className="flex-1">
                <span className="font-semibold text-gray-900">Ruta {ruta}</span>
                <div
                  className="w-4 h-4 rounded-full inline-block ml-2"
                  style={{
                    backgroundColor:
                      ruta === 1 ? '#3b82f6' : ruta === 2 ? '#ef4444' : '#10b981'
                  }}
                />
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onConfirmar}>
            Asignar a Ruta
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ModalAsignarRuta
