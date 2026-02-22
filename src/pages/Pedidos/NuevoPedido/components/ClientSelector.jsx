import React from 'react'
import { Card, Select } from '@components/common'

const ClientSelector = ({
  esClienteNuevo,
  setEsClienteNuevo,
  clienteSeleccionadoId,
  setClienteSeleccionadoId,
  clienteNuevo,
  updateClienteNuevo,
  clientesOptions,
  clienteNuevoValido
}) => {
  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Cliente</h3>

      {/* Toggle: Cliente Existente / Cliente Nuevo */}
      <div className="flex gap-6 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={!esClienteNuevo}
            onChange={() => setEsClienteNuevo(false)}
            className="w-4 h-4 text-primary-600"
          />
          <span className="font-medium">Seleccionar Cliente Existente</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={esClienteNuevo}
            onChange={() => setEsClienteNuevo(true)}
            className="w-4 h-4 text-primary-600"
          />
          <span className="font-medium">Registrar Cliente Nuevo</span>
        </label>
      </div>

      {/* Opción A: Seleccionar Cliente Existente */}
      {!esClienteNuevo && (
        <div>
          <Select
            label="Cliente"
            value={clienteSeleccionadoId}
            onChange={(e) => setClienteSeleccionadoId(e.target.value)}
            options={clientesOptions}
            placeholder="Selecciona un cliente"
            className="max-w-md"
          />
          {!clienteSeleccionadoId && (
            <p className="text-sm text-amber-600 mt-2">
              ⚠️ Debes seleccionar un cliente para continuar
            </p>
          )}
        </div>
      )}

      {/* Opción B: Registrar Cliente Nuevo */}
      {esClienteNuevo && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Cliente <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={clienteNuevo.nombre}
                onChange={(e) => updateClienteNuevo('nombre', e.target.value)}
                placeholder="Ej: Restaurante El Buen Sabor"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                value={clienteNuevo.telefono}
                onChange={(e) => updateClienteNuevo('telefono', e.target.value)}
                placeholder="Ej: 987654321"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={clienteNuevo.direccion}
                onChange={(e) => updateClienteNuevo('direccion', e.target.value)}
                placeholder="Ej: Av. Los Olivos 234"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distrito <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={clienteNuevo.distrito}
                onChange={(e) => updateClienteNuevo('distrito', e.target.value)}
                placeholder="Ej: San Isidro"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {!clienteNuevoValido && (
            <p className="text-sm text-amber-600">
              ⚠️ Completa todos los campos del cliente para continuar
            </p>
          )}
        </div>
      )}
    </Card>
  )
}

export default ClientSelector
