import { useState } from 'react'
import { Input, Button } from '@components/common'
import { formatearMoneda } from '@utils/formatters'
import { PricingService } from '@services/PricingService'

/**
 * ProductPriceTable Component
 *
 * Responsabilidad única: Renderizar tabla de productos con precios personalizables
 * Principio SOLID aplicado: SRP - Solo maneja UI, no lógica de negocio
 *
 * @param {Array} productos - Lista de productos disponibles
 * @param {Array} preciosSeleccionados - Precios ya configurados
 * @param {Function} onChange - Callback cuando cambian los precios
 */
const ProductPriceTable = ({ productos = [], preciosSeleccionados = [], onChange }) => {
  const [busqueda, setBusqueda] = useState('')
  const [errores, setErrores] = useState({})

  // Filtrar productos por búsqueda
  const productosFiltrados = productos.filter(p => {
    const nombreCompleto = PricingService.buildProductName(p).toLowerCase()
    return nombreCompleto.includes(busqueda.toLowerCase())
  })

  // Manejar cambio en checkbox de activación
  const handleToggleProducto = (productoId) => {
    const precioActual = preciosSeleccionados.find(p => p.productoId === productoId)
    const producto = productos.find(p => p.id === productoId)

    if (precioActual) {
      // Desactivar/Activar producto (toggle)
      const nuevosPrecios = preciosSeleccionados.map(p =>
        p.productoId === productoId ? { ...p, activo: !p.activo } : p
      )
      onChange(nuevosPrecios)
    } else {
      // Activar producto con precio base por defecto
      const precioBase = producto.precioBase || producto.precioKilo || 0
      const nuevoPrecio = {
        ...producto,
        id: producto.id,
        productoId: producto.id,
        nombreProducto: PricingService.buildProductName(producto),
        precioBase: precioBase,
        precioPersonalizado: precioBase,
        activo: true
      }
      onChange([...preciosSeleccionados, nuevoPrecio])
    }

    // Limpiar error si existe
    if (errores[productoId]) {
      const nuevosErrores = { ...errores }
      delete nuevosErrores[productoId]
      setErrores(nuevosErrores)
    }
  }

  // Manejar cambio en precio personalizado
  const handlePrecioChange = (productoId, nuevoPrecio) => {
    const producto = productos.find(p => p.id === productoId)
    const precioNumerico = parseFloat(nuevoPrecio)

    // Validar precio usando PricingService
    const validacion = PricingService.validateCustomPrice(precioNumerico, producto.precioBase || producto.precioKilo || 0)

    if (!validacion.isValid && nuevoPrecio !== '') {
      setErrores({
        ...errores,
        [productoId]: validacion.error
      })
    } else {
      // Limpiar error
      const nuevosErrores = { ...errores }
      delete nuevosErrores[productoId]
      setErrores(nuevosErrores)
    }

    // Actualizar precio
    const nuevosPrecios = preciosSeleccionados.map(p =>
      p.productoId === productoId
        ? { ...p, precioPersonalizado: nuevoPrecio === '' ? 0 : precioNumerico }
        : p
    )
    onChange(nuevosPrecios)
  }

  // Seleccionar/Deseleccionar todos los productos
  const handleToggleAll = (seleccionar) => {
    if (seleccionar) {
      // Seleccionar todos los productos
      const todosSeleccionados = productos.map(producto => {
        const precioExistente = preciosSeleccionados.find(p => p.productoId === producto.id || p.id === producto.id)
        const precioBase = producto.precioBase || producto.precioKilo || 0
        return {
          ...producto,
          productoId: producto.id,
          id: producto.id,
          nombreProducto: PricingService.buildProductName(producto),
          precioBase: precioBase,
          precioPersonalizado: precioExistente?.precioPersonalizado || precioBase,
          activo: true
        }
      })
      onChange(todosSeleccionados)
    } else {
      // Deseleccionar todos
      const todosDeseleccionados = preciosSeleccionados.map(p => ({ ...p, activo: false }))
      onChange(todosDeseleccionados)
    }
  }

  // Verificar si todos están seleccionados
  const todosSeleccionados = productos.length > 0 &&
    preciosSeleccionados.filter(p => p.activo).length === productos.length

  // Aplicar descuento global a todos los productos activos
  const handleAplicarDescuentoGlobal = () => {
    const descuento = prompt('Ingresa el porcentaje de descuento (ej: 15 para 15%):')

    if (descuento === null) return // Cancelado

    const descuentoNumerico = parseFloat(descuento)

    if (isNaN(descuentoNumerico) || descuentoNumerico < 0 || descuentoNumerico > 100) {
      alert('❌ Descuento inválido. Debe ser un número entre 0 y 100.')
      return
    }

    const nuevosPrecios = preciosSeleccionados.map(p => {
      const producto = productos.find(prod => prod.id === p.productoId)
      const precioBase = producto?.precioBase || producto?.precioKilo || 0
      const precioConDescuento = precioBase * (1 - descuentoNumerico / 100)

      return {
        ...p,
        precioPersonalizado: Math.round(precioConDescuento * 100) / 100
      }
    })

    onChange(nuevosPrecios)
    alert(`✅ Descuento del ${descuentoNumerico}% aplicado a ${nuevosPrecios.length} producto(s)`)
  }

  // Obtener precio configurado para un producto
  const getPrecioProducto = (productoId) => {
    return preciosSeleccionados.find(p => p.productoId === productoId)
  }

  return (
    <div className="space-y-4">
      {/* Header con búsqueda y acciones */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="max-w-md"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant={todosSeleccionados ? "danger" : "primary"}
            size="sm"
            onClick={() => handleToggleAll(!todosSeleccionados)}
          >
            {todosSeleccionados ? "Deseleccionar Todos" : "Seleccionar Todos"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAplicarDescuentoGlobal}
            disabled={preciosSeleccionados.filter(p => p.activo).length === 0}
          >
            Aplicar Descuento Global
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          💡 <strong>Selecciona los productos</strong> que este cliente puede comprar y asigna su <strong>precio específico</strong>.
          Solo se guardarán los productos marcados.
        </p>
      </div>

      {/* Tabla de productos */}
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                Activo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Precio Base
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                Precio Personalizado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Ahorro
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  {busqueda ? 'No se encontraron productos' : 'No hay productos disponibles'}
                </td>
              </tr>
            ) : (
              productosFiltrados.map((producto) => {
                const precioConfig = getPrecioProducto(producto.id)
                const isActivo = precioConfig?.activo || false
                const precioBase = producto.precioBase || producto.precioKilo || 0
                const precioPersonalizado = precioConfig?.precioPersonalizado || precioBase
                const ahorro = precioBase - precioPersonalizado
                const porcentajeAhorro = PricingService.calculateDiscountPercentage(precioPersonalizado, precioBase)

                return (
                  <tr
                    key={producto.id}
                    className={`${isActivo ? 'bg-green-50' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isActivo}
                        onChange={() => handleToggleProducto(producto.id)}
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                      />
                    </td>

                    {/* Nombre del producto */}
                    <td className="px-4 py-3">
                      <span className={`font-medium ${isActivo ? 'text-gray-900' : 'text-gray-500'}`}>
                        {PricingService.buildProductName(producto)}
                      </span>
                    </td>

                    {/* Precio Base */}
                    <td className="px-4 py-3">
                      <span className="text-gray-700 font-semibold">
                        {formatearMoneda(precioBase)}
                      </span>
                    </td>

                    {/* Precio Personalizado */}
                    <td className="px-4 py-3">
                      {isActivo ? (
                        <div>
                          <Input
                            type="number"
                            value={precioPersonalizado}
                            onChange={(e) => handlePrecioChange(producto.id, e.target.value)}
                            min="0"
                            step="0.01"
                            className="w-full"
                            error={errores[producto.id]}
                          />
                          {errores[producto.id] && (
                            <p className="text-xs text-red-600 mt-1">{errores[producto.id]}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Ahorro */}
                    <td className="px-4 py-3">
                      {isActivo ? (
                        <div className="text-right">
                          <div className={`font-semibold ${ahorro > 0 ? 'text-green-600' : ahorro < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {ahorro > 0 ? '-' : ahorro < 0 ? '+' : ''}
                            {formatearMoneda(Math.abs(ahorro))}
                          </div>
                          <div className="text-xs text-gray-500">
                            ({porcentajeAhorro > 0 ? '-' : porcentajeAhorro < 0 ? '+' : ''}{Math.abs(porcentajeAhorro).toFixed(1)}%)
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Resumen */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Productos seleccionados:</p>
            <p className="text-2xl font-bold text-gray-900">
              {preciosSeleccionados.filter(p => p.activo).length} / {productos.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Ahorro promedio:</p>
            <p className="text-2xl font-bold text-green-600">
              {preciosSeleccionados.filter(p => p.activo).length > 0
                ? PricingService.calculateTotalSavings(
                    preciosSeleccionados
                      .filter(p => p.activo)
                      .map(p => ({
                        precioBase: p.precioBase,
                        precioPersonalizado: p.precioPersonalizado,
                        cantidad: 1
                      }))
                  ).porcentajePromedio.toFixed(1)
                : '0.0'}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPriceTable
