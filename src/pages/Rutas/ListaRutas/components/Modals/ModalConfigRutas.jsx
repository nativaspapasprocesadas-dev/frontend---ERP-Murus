import React from 'react'
import { Modal, Button, Badge } from '@components/common'

const ModalConfigRutas = ({
  isOpen,
  onClose,
  rutasConfig,
  onNuevaRuta,
  onEditarRuta,
  onCambiarEstado
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuración de Rutas"
      size="xl"
    >
      <div className="space-y-4">
        {/* Información */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Nota:</strong> Las rutas se utilizan para organizar clientes, pedidos y la producción diaria.
            Las rutas nuevas aparecerán automáticamente en "Rutas de Hoy".
          </p>
        </div>

        {/* Botón para crear nueva ruta */}
        <div className="flex justify-end">
          <Button onClick={onNuevaRuta}>
            + Nueva Ruta
          </Button>
        </div>

        {/* Tabla de rutas configuradas */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">#</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Nombre</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Descripción</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Color</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Hora Límite</th>
                <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Estado</th>
                <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rutasConfig.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    No hay rutas configuradas. Haz clic en "+ Nueva Ruta" para crear una.
                  </td>
                </tr>
              ) : rutasConfig.map((ruta) => (
                <tr key={ruta.id}>
                  <td className="px-4 py-3 text-lg font-bold">{ruta.numero}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: ruta.color }}
                      />
                      <span className="font-semibold">{ruta.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {ruta.descripcion || <span className="text-gray-400">Sin descripción</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border-2 border-gray-300"
                        style={{ backgroundColor: ruta.color }}
                      />
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{ruta.color}</code>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {ruta.horaLimiteRecepcion ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{ruta.horaLimiteRecepcion}</span>
                        <span className="text-xs text-gray-500">hrs</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No definida</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={ruta.activo ? 'success' : 'gray'}>
                      {ruta.activo ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onEditarRuta(ruta)}
                      >
                        ✏️ Editar
                      </Button>
                      <Button
                        size="sm"
                        variant={ruta.activo ? 'danger' : 'success'}
                        onClick={() => onCambiarEstado(ruta)}
                      >
                        {ruta.activo ? '🚫 Desactivar' : '✅ Activar'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Botón cerrar */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ModalConfigRutas
