import React from 'react'

const CartItemEditor = ({
  productoEditando,
  setProductoEditando,
  especiesOptions,
  medidasOptions,
  presentacionesOptions
}) => {
  return (
    <tr>
      <td colSpan="8" className="px-4 py-4 bg-blue-50 border-t-2 border-blue-300">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-blue-900 mb-3">Editar Producto:</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Especie</label>
              <select
                value={productoEditando.especieId}
                onChange={(e) => setProductoEditando({
                  especieId: e.target.value,
                  medidaId: '',
                  presentacionId: '',
                  cantidad: productoEditando.cantidad
                })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Selecciona especie</option>
                {especiesOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Medida</label>
              <select
                value={productoEditando.medidaId}
                onChange={(e) => setProductoEditando({
                  ...productoEditando,
                  medidaId: e.target.value,
                  presentacionId: ''
                })}
                disabled={!productoEditando.especieId}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Selecciona medida</option>
                {medidasOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de corte (Kg por bolsa)</label>
              <select
                value={productoEditando.presentacionId}
                onChange={(e) => setProductoEditando({
                  ...productoEditando,
                  presentacionId: e.target.value
                })}
                disabled={!productoEditando.medidaId}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Selecciona peso</option>
                {presentacionesOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cantidad (bolsas)</label>
              <input
                type="number"
                min="1"
                value={productoEditando.cantidad}
                onChange={(e) => setProductoEditando({
                  ...productoEditando,
                  cantidad: parseInt(e.target.value) || 1
                })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

export default CartItemEditor
