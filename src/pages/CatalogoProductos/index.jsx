import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Select } from '@components/common'
import ProductCard from '@components/Productos/ProductCard'
import { useCatalog } from '@hooks/useCatalog'
import { useClienteActual } from '@hooks/useClienteActual'

/**
 * Vista de Catálogo de Productos para Clientes
 * Integrado con API-014 GET /api/v1/catalog/products
 * Incluye filtros por especie y medida desde APIs auxiliares
 */
const CatalogoProductos = () => {
  const navigate = useNavigate()
  const {
    productosVisiblesEnCatalogo,
    especies,
    medidas,
    filtros,
    setFiltros,
    limpiarFiltros,
    loading
  } = useCatalog()
  const cliente = useClienteActual()

  // Los productos ya vienen filtrados del backend según query params
  const productosFiltrados = productosVisiblesEnCatalogo

  // Opciones para los filtros desde APIs reales
  const especiesOptions = useMemo(() => {
    return especies
      .filter(e => e.activa)
      .map(e => ({ value: e.id, label: e.nombre }))
  }, [especies])

  const medidasOptions = useMemo(() => {
    return medidas
      .filter(m => m.activa)
      .map(m => ({ value: m.id, label: m.nombre }))
  }, [medidas])

  // Calcular precio con descuento
  // API-014 ya retorna discountedPrice calculado por el backend
  const calcularPrecioConDescuento = (producto) => {
    if (producto._precioConDescuento) {
      const kilos = producto.presentacion?.kilos || 10
      return producto._precioConDescuento * kilos
    }
    return producto.precioTotal
  }

  // Manejar cambio de filtro
  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de Productos</h1>
          <p className="text-gray-600 mt-1">
            Explora nuestros productos disponibles
            {cliente?.descuento > 0 && (
              <span className="text-green-600 font-semibold ml-2">
                (Descuento del {(cliente.descuento * 100).toFixed(0)}% aplicado)
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => navigate('/pedidos/nuevo')}>
          🛒 Hacer Pedido
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={limpiarFiltros}
            >
              Limpiar Filtros
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro por Especie */}
            <Select
              label="Especie"
              value={filtros.especieId}
              onChange={(e) => handleFiltroChange('especieId', e.target.value)}
              options={especiesOptions}
              placeholder="Todas las especies"
            />

            {/* Filtro por Medida */}
            <Select
              label="Medida"
              value={filtros.medidaId}
              onChange={(e) => handleFiltroChange('medidaId', e.target.value)}
              options={medidasOptions}
              placeholder="Todas las medidas"
            />
          </div>

          {/* Contador de resultados */}
          <div className="text-sm text-gray-600 border-t border-gray-200 pt-3">
            Mostrando <span className="font-semibold">{productosFiltrados.length}</span> de{' '}
            <span className="font-semibold">{productosVisiblesEnCatalogo.length}</span> productos disponibles
          </div>
        </div>
      </Card>

      {/* Grid de productos */}
      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Cargando productos...</p>
          </div>
        </Card>
      ) : productosFiltrados.length === 0 ? (
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
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No se encontraron productos
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Intenta ajustar tus filtros o buscar con otros términos
            </p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={limpiarFiltros}
            >
              Limpiar Filtros
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productosFiltrados.map((producto) => (
            <ProductCard
              key={producto.id}
              producto={producto}
              precioConDescuento={calcularPrecioConDescuento(producto)}
              onSelect={(prod) => navigate(`/catalogo/${prod.id}`)}
            />
          ))}
        </div>
      )}

      {/* Call to action flotante */}
      {productosFiltrados.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            onClick={() => navigate('/pedidos/nuevo')}
            className="shadow-2xl"
          >
            🛒 Hacer Pedido Ahora
          </Button>
        </div>
      )}
    </div>
  )
}

export default CatalogoProductos
