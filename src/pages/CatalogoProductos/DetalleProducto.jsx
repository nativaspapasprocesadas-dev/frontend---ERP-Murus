import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Badge } from '@components/common'
import { useProductDetail } from '@hooks/useProductDetail'
import { useClienteActual } from '@hooks/useClienteActual'
import { formatearMoneda } from '@utils/formatters'

/**
 * Vista de Detalle de Producto para Clientes
 * Integrado con API-015 GET /api/v1/catalog/products/{id}
 * Muestra información completa del producto con imagen y precios personalizados
 */
const DetalleProducto = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { producto, loading: loadingProducto } = useProductDetail(id)
  const cliente = useClienteActual()

  // Construir URL completa de la imagen
  const getImageUrl = (fotoUrl) => {
    if (!fotoUrl) return null
    if (fotoUrl.startsWith('http')) return fotoUrl
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4020'
    return `${baseUrl}${fotoUrl}`
  }

  // Calcular precios con descuento
  // API-015 ya retorna discountedPrice calculado según el descuento del cliente
  const precios = useMemo(() => {
    if (!producto) return null

    // Si el backend retornó precio con descuento, usarlo
    const precioBaseConDescuento = producto._precioConDescuento || producto.precioBaseKg
    const kilos = producto.presentacion?.kilos || 1
    const precioTotalConDescuento = precioBaseConDescuento * kilos
    const descuento = producto._precioConDescuento
      ? (producto.precioBaseKg - producto._precioConDescuento) / producto.precioBaseKg
      : (cliente?.descuento || 0)

    return {
      precioBase: producto.precioBaseKg,
      precioBaseConDescuento,
      precioTotal: producto.precioTotal,
      precioTotalConDescuento,
      descuento,
      ahorroTotal: producto.precioTotal - precioTotalConDescuento
    }
  }, [producto, cliente])

  // Estado de carga
  if (loadingProducto) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Cargando producto...</h1>
        </div>
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        </Card>
      </div>
    )
  }

  // Si no se encuentra el producto
  if (!producto) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Producto no encontrado</h1>
          <Button variant="secondary" onClick={() => navigate('/catalogo')}>
            ← Volver al Catálogo
          </Button>
        </div>
        <Card>
          <div className="text-center py-12">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Producto no disponible
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Este producto no está disponible en el catálogo actualmente. Por favor, regresa al catálogo para ver los productos disponibles.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/catalogo')}
            className="mb-2"
          >
            ← Volver al Catálogo
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {producto.nombreCompleto}
          </h1>
          {precios.descuento > 0 && (
            <p className="text-green-600 font-semibold mt-1">
              Descuento del {(precios.descuento * 100).toFixed(0)}% aplicado
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna Izquierda: Imagen */}
        <Card>
          <div className="space-y-4">
            {/* Imagen principal */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square">
              {getImageUrl(producto.fotoUrl) ? (
                <img
                  src={getImageUrl(producto.fotoUrl)}
                  alt={producto.nombreCompleto}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <svg
                    className="w-32 h-32 text-gray-400"
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
              )}

              {/* Badge de estado */}
              {!producto.activo && (
                <div className="absolute top-4 right-4">
                  <Badge variant="danger">No disponible</Badge>
                </div>
              )}
            </div>

            {/* Información adicional */}
            <div className="text-sm text-gray-600 space-y-2 bg-blue-50 p-4 rounded-lg">
              <p className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                </svg>
                <span>Producto disponible para entrega inmediata</span>
              </p>
              <p className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                </svg>
                <span>Entrega según la ruta programada</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Columna Derecha: Información y Acciones */}
        <div className="space-y-6">
          {/* Información del Producto */}
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Información del Producto</h3>
            <div className="space-y-4">
              {/* Especie */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Especie</span>
                <span className="text-gray-900 font-semibold">{producto.especie?.nombre}</span>
              </div>

              {/* Medida */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Medida</span>
                <Badge variant="info">{producto.medida?.nombre}</Badge>
              </div>

              {/* Presentación */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Presentación</span>
                <span className="text-gray-900 font-bold text-lg">
                  {producto.presentacion?.kilos} kg
                </span>
              </div>

              {/* Estado */}
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600 font-medium">Estado</span>
                <Badge variant={producto.activo ? 'success' : 'danger'}>
                  {producto.activo ? 'Disponible' : 'No disponible'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Precios */}
          <Card className="bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Precios</h3>
            <div className="space-y-4">
              {/* Precio por kg */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Precio por Kilogramo</p>
                <div className="flex items-center gap-3">
                  {precios.descuento > 0 && (
                    <span className="text-lg text-gray-500 line-through">
                      {formatearMoneda(precios.precioBase)}
                    </span>
                  )}
                  <span className="text-2xl font-bold text-primary-600">
                    {formatearMoneda(precios.precioBaseConDescuento)}
                  </span>
                </div>
              </div>

              {/* Precio total por bolsa */}
              <div className="border-t border-primary-200 pt-4">
                <p className="text-sm text-gray-600 mb-1">
                  Precio por Bolsa ({producto.presentacion?.kilos} kg)
                </p>
                <div className="flex items-center gap-3">
                  {precios.descuento > 0 && (
                    <span className="text-xl text-gray-500 line-through">
                      {formatearMoneda(precios.precioTotal)}
                    </span>
                  )}
                  <span className="text-3xl font-bold text-primary-600">
                    {formatearMoneda(precios.precioTotalConDescuento)}
                  </span>
                </div>
              </div>

              {/* Ahorro */}
              {precios.descuento > 0 && (
                <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800">
                    ¡Ahorras {formatearMoneda(precios.ahorroTotal)} por bolsa!
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Botones de Acción */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate('/pedidos/nuevo')}
              disabled={!producto.activo}
            >
              🛒 Agregar al Pedido
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/catalogo')}
            >
              Seguir Explorando
            </Button>
          </div>

          {/* Nota informativa */}
          {!producto.activo && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">Nota:</span> Este producto no está disponible actualmente.
                Por favor, contacta con nosotros para más información.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DetalleProducto
