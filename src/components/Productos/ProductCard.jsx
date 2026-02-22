import PropTypes from 'prop-types'
import { Badge } from '@components/common'
import { formatearMoneda } from '@utils/formatters'

/**
 * Tarjeta de producto reutilizable
 * Responsabilidad única: Mostrar información visual de un producto
 * Extensible: Acepta props configurables
 */
const ProductCard = ({ producto, precioConDescuento, onSelect, showActions = true }) => {
  const precio = precioConDescuento !== undefined ? precioConDescuento : producto.precioTotal

  // Construir URL completa de la imagen
  const getImageUrl = (fotoUrl) => {
    if (!fotoUrl) return null
    if (fotoUrl.startsWith('http')) return fotoUrl
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4020'
    return `${baseUrl}${fotoUrl}`
  }

  const imagenUrl = getImageUrl(producto.fotoUrl)

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200">
      {/* Imagen del producto */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {imagenUrl ? (
          <img
            src={imagenUrl}
            alt={producto.nombreCompleto}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className={`w-full h-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ${imagenUrl ? 'hidden' : 'flex'}`}
          style={{ position: imagenUrl ? 'absolute' : 'relative', top: 0, left: 0 }}
        >
          <svg
            className="w-24 h-24 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        {/* Badge de estado */}
        {!producto.activo && (
          <div className="absolute top-2 right-2">
            <Badge variant="danger">Inactivo</Badge>
          </div>
        )}
      </div>

      {/* Información del producto */}
      <div className="p-4 space-y-3">
        {/* Nombre del producto */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
            {producto.nombreCompleto}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {producto.especie?.nombre} - {producto.medida?.nombre}
          </p>
        </div>

        {/* Acciones */}
        {showActions && (
          <button
            onClick={() => onSelect?.(producto)}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 mt-4"
          >
            Ver Detalle
          </button>
        )}
      </div>
    </div>
  )
}

ProductCard.propTypes = {
  producto: PropTypes.shape({
    id: PropTypes.number.isRequired,
    nombreCompleto: PropTypes.string.isRequired,
    fotoUrl: PropTypes.string,
    activo: PropTypes.bool,
    precioBaseKg: PropTypes.number.isRequired,
    precioTotal: PropTypes.number.isRequired,
    especie: PropTypes.object,
    medida: PropTypes.object,
    presentacion: PropTypes.object
  }).isRequired,
  precioConDescuento: PropTypes.number,
  onSelect: PropTypes.func,
  showActions: PropTypes.bool
}

export default ProductCard
