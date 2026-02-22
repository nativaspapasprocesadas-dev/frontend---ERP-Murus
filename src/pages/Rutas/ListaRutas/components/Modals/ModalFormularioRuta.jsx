import React from 'react'
import { Modal, Button } from '@components/common'

const ModalFormularioRuta = ({
  isOpen,
  onClose,
  editando,
  formulario,
  onChange,
  onGuardar,
  isSuperAdmin = false,
  sedes = []
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editando ? 'Editar Ruta' : 'Nueva Ruta'}
    >
      <div className="space-y-4">
        {/* Número de ruta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Ruta *
          </label>
          <input
            type="number"
            name="numero"
            min="1"
            value={formulario.numero}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Ej: 1, 2, 3..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Número identificador único de la ruta
          </p>
        </div>

        {/* Selector de Sede - Solo para SUPERADMIN al crear */}
        {!editando && isSuperAdmin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sede *
            </label>
            <select
              name="sedeId"
              value={formulario.sedeId || ''}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Seleccione una sede...</option>
              {sedes.map((sede) => (
                <option key={sede.id} value={sede.id}>
                  {sede.nombre}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Seleccione la sede a la que pertenecerá esta ruta
            </p>
          </div>
        )}

        {/* Nombre de ruta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la Ruta *
          </label>
          <input
            type="text"
            name="nombre"
            value={formulario.nombre}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Ej: Ruta Azul, Ruta Norte..."
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <input
            type="text"
            name="descripcion"
            value={formulario.descripcion}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Ej: Zona Norte, Centro de la ciudad..."
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color Identificador *
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="color"
              value={formulario.color}
              onChange={onChange}
              className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              name="color"
              value={formulario.color}
              onChange={onChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
              placeholder="#3b82f6"
            />
            <div
              className="w-10 h-10 rounded border-2 border-gray-300"
              style={{ backgroundColor: formulario.color }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Color que se usará para identificar esta ruta en el sistema
          </p>
        </div>

        {/* Hora límite de recepción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hora límite de recepción de pedidos
          </label>
          <input
            type="time"
            name="horaLimiteRecepcion"
            value={formulario.horaLimiteRecepcion || ''}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Hora hasta la cual los clientes pueden hacer pedidos para esta ruta (formato 24hrs)
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onGuardar}>
            {editando ? 'Actualizar Ruta' : 'Crear Ruta'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ModalFormularioRuta
