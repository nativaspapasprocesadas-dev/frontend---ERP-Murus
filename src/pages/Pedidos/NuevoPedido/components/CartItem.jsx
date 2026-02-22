import React from 'react'
import { Button } from '@components/common'
import { formatearMoneda } from '@utils/formatters'

// Construir URL completa de la imagen del producto
const getImageUrl = (fotoUrl) => {
  if (!fotoUrl) return null
  if (fotoUrl.startsWith('http')) return fotoUrl
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4020'
  return `${baseUrl}${fotoUrl}`
}

const CartItem = ({
  item,
  index,
  onEdit,
  onDelete,
  onSaveEdit,
  onCancelEdit,
  isEditing,
  productoEditandoSeleccionado,
  productoEditando
}) => {
  // Si está en modo edición, mostrar valores del producto siendo editado
  const displayItem = isEditing && productoEditandoSeleccionado ? {
    fotoUrl: productoEditandoSeleccionado.fotoUrl,
    nombreProducto: productoEditandoSeleccionado.nombreCompleto,
    cantidad: productoEditando.cantidad,
    kilosPorBolsa: productoEditandoSeleccionado.presentacion.kilos,
    precioKg: productoEditandoSeleccionado.precioKg,
    subtotal: productoEditandoSeleccionado.presentacion.kilos * (productoEditando.cantidad || 1) * productoEditandoSeleccionado.precioKg
  } : item

  return (
    <tr>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center">
          {getImageUrl(displayItem.fotoUrl) ? (
            <img
              src={getImageUrl(displayItem.fotoUrl)}
              alt={displayItem.nombreProducto}
              className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
              onError={(e) => {
                e.target.onerror = null
                e.target.style.display = 'none'
                e.target.nextElementSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div
            className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-gray-200 items-center justify-center"
            style={{ display: getImageUrl(displayItem.fotoUrl) ? 'none' : 'flex' }}
          >
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        {displayItem.nombreProducto}
      </td>
      <td className="px-4 py-3 text-sm text-center">
        <span className="font-semibold">{displayItem.cantidad}</span>
      </td>
      <td className="px-4 py-3 text-sm text-center">
        {displayItem.kilosPorBolsa} kg
      </td>
      <td className="px-4 py-3 text-sm text-center font-semibold">
        {(displayItem.cantidad * displayItem.kilosPorBolsa).toFixed(2)} kg
      </td>
      <td className="px-4 py-3 text-sm text-right">
        {formatearMoneda(displayItem.precioKg)}
      </td>
      <td className="px-4 py-3 text-sm text-right font-bold text-primary-600">
        {formatearMoneda(displayItem.subtotal)}
      </td>
      <td className="px-4 py-3 text-center">
        {isEditing ? (
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              variant="primary"
              onClick={() => onSaveEdit(index)}
            >
              Guardar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onCancelEdit}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onEdit(index)}
            >
              Editar
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => onDelete(index)}
            >
              Eliminar
            </Button>
          </div>
        )}
      </td>
    </tr>
  )
}

export default CartItem
