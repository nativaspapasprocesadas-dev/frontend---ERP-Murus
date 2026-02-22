import React from 'react'
import { Modal, Button, Select } from '@components/common'

const ModalAsignarChofer = ({
  isOpen,
  onClose,
  ruta,
  labels,
  choferesOptions,
  choferSeleccionado,
  onChoferChange,
  onConfirmar
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Chofer y Enviar Ruta"
    >
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>📍 Ruta:</strong> {ruta && labels[ruta.numero]}
          </p>
          <p className="text-sm text-blue-900 mt-1">
            <strong>📦 Pedidos:</strong> {ruta?.cantidadPedidos || 0}
          </p>
          {ruta?.sedeName && (
            <p className="text-sm text-blue-900 mt-1">
              <strong>🏢 Sede:</strong> {ruta.sedeName}
            </p>
          )}
        </div>

        {choferesOptions.length === 0 ? (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-900">
              <strong>⚠️ Sin choferes disponibles</strong>
            </p>
            <p className="text-xs text-red-700 mt-1">
              No hay choferes activos asignados a esta sede. Por favor, registre un chofer para esta sede primero.
            </p>
          </div>
        ) : (
          <Select
            label="Seleccionar Chofer"
            value={choferSeleccionado}
            onChange={(e) => onChoferChange(e.target.value)}
            options={choferesOptions}
            required
            placeholder="Selecciona un chofer..."
          />
        )}

        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-900">
            <strong>Importante:</strong> Al asignar un chofer y enviar la ruta, el estado cambiará a "ENVIADA" y quedará registrado en el historial.
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={onConfirmar}
            disabled={!choferSeleccionado || choferesOptions.length === 0}
          >
            🚚 Asignar y Enviar Ruta
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ModalAsignarChofer
