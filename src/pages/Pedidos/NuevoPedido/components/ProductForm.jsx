import React, { useState, useMemo } from 'react'
import { Card, Button, Select } from '@components/common'
import { useProductFilters } from '../hooks/useProductFilters'
import { formatearMoneda } from '@utils/formatters'

// Construir URL completa de la imagen del producto
const getImageUrl = (fotoUrl) => {
  if (!fotoUrl) return null
  if (fotoUrl.startsWith('http')) return fotoUrl
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4020'
  return `${baseUrl}${fotoUrl}`
}

const ProductForm = ({ onAdd, cliente }) => {
  // Estado del formulario de producto
  const [productoForm, setProductoForm] = useState({
    especieId: '',
    medidaId: '',
    presentacionId: '',
    cantidad: 1
  })

  // Hook de filtrado (integrado con API-045, API-049, API-053, GET /products/for-orders)
  // Pasa customerId para obtener precios especiales del cliente
  const {
    especiesOptions,
    medidasOptions,
    presentacionesOptions,
    productoSeleccionado,
    loading,
    error
  } = useProductFilters({
    especieId: productoForm.especieId,
    medidaId: productoForm.medidaId,
    presentacionId: productoForm.presentacionId,
    customerId: cliente?.id || null
  })

  // Calcular subtotal del producto actual
  const subtotalProducto = useMemo(() => {
    if (!productoSeleccionado || !productoForm.cantidad) return 0
    const kilosTotales = productoSeleccionado.presentacion.kilos * productoForm.cantidad
    return kilosTotales * productoSeleccionado.precioKg
  }, [productoSeleccionado, productoForm.cantidad])

  // Agregar producto al carrito
  const handleAgregar = () => {
    if (onAdd(productoSeleccionado, productoForm.cantidad, subtotalProducto)) {
      // Resetear formulario
      setProductoForm({
        especieId: '',
        medidaId: '',
        presentacionId: '',
        cantidad: 1
      })
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Seleccionar Producto</h3>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          Error al cargar productos: {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Select
          label="Especie"
          value={productoForm.especieId}
          onChange={(e) => setProductoForm({
            especieId: e.target.value,
            medidaId: '',
            presentacionId: '',
            cantidad: 1
          })}
          options={especiesOptions}
          placeholder="Selecciona especie"
        />
        <Select
          label="Unidad/Peso"
          value={productoForm.medidaId}
          onChange={(e) => setProductoForm({
            ...productoForm,
            medidaId: e.target.value,
            presentacionId: ''
          })}
          options={medidasOptions}
          placeholder="Selecciona unidad"
          disabled={!productoForm.especieId}
        />
        <Select
          label="Tipo de corte"
          value={productoForm.presentacionId}
          onChange={(e) => setProductoForm({
            ...productoForm,
            presentacionId: e.target.value
          })}
          options={presentacionesOptions}
          placeholder="Tipo de corte"
          disabled={!productoForm.medidaId}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad (bolsas)
          </label>
          <input
            type="number"
            min="1"
            value={productoForm.cantidad}
            onChange={(e) => setProductoForm({
              ...productoForm,
              cantidad: parseInt(e.target.value) || 1
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-end">
          <Button
            onClick={handleAgregar}
            disabled={!productoSeleccionado || productoForm.cantidad < 1}
            className="w-full"
          >
            + Agregar
          </Button>
        </div>
      </div>

      {/* Información del producto seleccionado */}
      {productoSeleccionado && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <div className="flex gap-4">
            {/* Imagen del producto */}
            <div className="flex-shrink-0 w-32 h-32">
              {getImageUrl(productoSeleccionado.fotoUrl) ? (
                <img
                  src={getImageUrl(productoSeleccionado.fotoUrl)}
                  alt={productoSeleccionado.nombreCompleto}
                  className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300 shadow-sm"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.style.display = 'none'
                    e.target.nextElementSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div
                className="w-32 h-32 bg-gray-200 rounded-lg border-2 border-gray-300 items-center justify-center"
                style={{ display: getImageUrl(productoSeleccionado.fotoUrl) ? 'none' : 'flex' }}
              >
                <svg
                  className="w-16 h-16 text-gray-400"
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

            {/* Información del producto */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Producto</p>
                <p className="font-semibold">{productoSeleccionado.nombreCompleto}</p>
              </div>
              <div>
                <p className="text-gray-600">Precio por Kg</p>
                <p className="font-semibold text-primary-600">
                  {formatearMoneda(productoSeleccionado.precioKg)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Kilos</p>
                <p className="font-semibold">
                  {(productoSeleccionado.presentacion.kilos * productoForm.cantidad).toFixed(2)} kg
                </p>
              </div>
              <div>
                <p className="text-gray-600">Subtotal</p>
                <p className="font-bold text-lg text-primary-600">
                  {formatearMoneda(subtotalProducto)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default ProductForm
