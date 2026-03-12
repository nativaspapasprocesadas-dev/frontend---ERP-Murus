import { useState, useMemo } from 'react'
import { Input, Button, Modal } from '@components/common'
import { formatearMoneda } from '@utils/formatters'
import { PricingService } from '@services/PricingService'

const DISCOUNT_MIN = 0
const DISCOUNT_MAX = 100
const PRICE_STEP = 0.01
const PRICE_MIN = 0
const PERCENTAGE_DECIMALS = 1
const DEFAULT_SPECIES_NAME = 'Sin especie'
const CHIP_MAX_WIDTH = 150

/**
 * DiscountModal - Modal para aplicar descuento global
 * Reemplaza prompt()/alert() nativos
 */
const DiscountModal = ({ isOpen, onClose, onApply, productosActivosCount }) => {
  const [descuento, setDescuento] = useState('')
  const [error, setError] = useState('')

  const handleApply = () => {
    const valor = parseFloat(descuento)
    if (isNaN(valor) || valor < DISCOUNT_MIN || valor > DISCOUNT_MAX) {
      setError(`El descuento debe ser un numero entre ${DISCOUNT_MIN} y ${DISCOUNT_MAX}`)
      return
    }
    onApply(valor)
    setDescuento('')
    setError('')
    onClose()
  }

  const handleClose = () => {
    setDescuento('')
    setError('')
    onClose()
  }

  const valorPreview = parseFloat(descuento)
  const showPreview = descuento && !isNaN(valorPreview) && valorPreview >= DISCOUNT_MIN && valorPreview <= DISCOUNT_MAX

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Aplicar Descuento Global" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Se aplicara el descuento a los <strong>{productosActivosCount}</strong> productos
          seleccionados, calculando el precio personalizado desde el precio base.
        </p>

        <Input
          label="Porcentaje de descuento"
          name="descuento"
          type="number"
          value={descuento}
          onChange={(e) => {
            setDescuento(e.target.value)
            setError('')
          }}
          placeholder="Ej: 15"
          min={DISCOUNT_MIN}
          max={DISCOUNT_MAX}
          step="0.5"
          error={error}
        />

        {showPreview && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <p className="text-sm text-primary-800">
              Ejemplo: Precio base {formatearMoneda(100)} → Nuevo precio:{' '}
              <strong>{formatearMoneda(100 * (1 - valorPreview / DISCOUNT_MAX))}</strong>
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleApply}>
            Aplicar Descuento
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/**
 * SelectedProductsChips - Muestra chips con productos seleccionados
 * Click en chip = deseleccionar
 */
const SelectedProductsChips = ({ preciosSeleccionados, productos, onToggleProducto }) => {
  const activos = preciosSeleccionados.filter(p => p.activo)

  if (activos.length === 0) return null

  const activosPorEspecie = useMemo(() => {
    const grupos = {}
    activos.forEach(precioItem => {
      const producto = productos.find(p => p.id === precioItem.productoId)
      if (!producto) return
      const especie = producto.especie?.nombre || DEFAULT_SPECIES_NAME
      if (!grupos[especie]) grupos[especie] = []
      grupos[especie].push({ ...precioItem, producto })
    })
    return Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b))
  }, [activos, productos])

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
      <p className="text-xs font-medium text-green-800 mb-2">
        Productos seleccionados ({activos.length}):
      </p>
      <div className="flex flex-wrap gap-1.5">
        {activosPorEspecie.map(([, items]) =>
          items.map(item => (
            <span
              key={item.productoId}
              className="inline-flex items-center gap-1 px-2 py-1
                         bg-green-100 text-green-800 rounded-full text-xs
                         font-medium cursor-pointer hover:bg-red-100
                         hover:text-red-800 transition-colors group"
              onClick={() => onToggleProducto(item.productoId)}
              title={`Click para deseleccionar - ${PricingService.buildProductName(item.producto)}`}
            >
              <span className="truncate" style={{ maxWidth: `${CHIP_MAX_WIDTH}px` }}>
                {PricingService.buildProductName(item.producto)}
              </span>
              <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          ))
        )}
      </div>
    </div>
  )
}

/**
 * SpeciesGroup - Accordion colapsable por especie
 */
const SpeciesGroup = ({
  especieNombre,
  productosGrupo,
  preciosSeleccionados,
  isExpanded,
  onToggleExpand,
  onToggleProducto,
  onToggleAllBySpecies,
  onPrecioChange,
  errores,
  getPrecioProducto
}) => {
  const productosDelGrupoIds = useMemo(
    () => productosGrupo.map(p => p.id),
    [productosGrupo]
  )
  const activosEnGrupo = preciosSeleccionados
    .filter(ps => productosDelGrupoIds.includes(ps.productoId) && ps.activo)
    .length
  const todosActivosEnGrupo = productosGrupo.length > 0 && activosEnGrupo === productosGrupo.length

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header del accordion */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50
                   cursor-pointer hover:bg-gray-100 transition-colors select-none"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform duration-200
                       ${isExpanded ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5l7 7-7 7" />
          </svg>

          <input
            type="checkbox"
            checked={todosActivosEnGrupo}
            onChange={(e) => {
              e.stopPropagation()
              onToggleAllBySpecies(especieNombre, !todosActivosEnGrupo)
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />

          <span className="font-semibold text-gray-900">{especieNombre}</span>

          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            activosEnGrupo > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {activosEnGrupo}/{productosGrupo.length}
          </span>
        </div>
      </div>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-12">
                  Activo
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Producto
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-28">
                  P. Base
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-36">
                  P. Personalizado
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">
                  Ahorro
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productosGrupo.map(producto => {
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
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={isActivo}
                        onChange={() => onToggleProducto(producto.id)}
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <span className={`font-medium text-sm ${isActivo ? 'text-gray-900' : 'text-gray-500'}`}>
                        {PricingService.buildProductName(producto)}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-gray-700 font-semibold text-sm">
                        {formatearMoneda(precioBase)}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {isActivo ? (
                        <div>
                          <Input
                            type="number"
                            value={precioPersonalizado}
                            onChange={(e) => onPrecioChange(producto.id, e.target.value)}
                            min={PRICE_MIN}
                            step={PRICE_STEP}
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
                    <td className="px-4 py-2">
                      {isActivo ? (
                        <div className="text-right">
                          <div className={`font-semibold text-sm ${ahorro > 0 ? 'text-green-600' : ahorro < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {ahorro > 0 ? '-' : ahorro < 0 ? '+' : ''}
                            {formatearMoneda(Math.abs(ahorro))}
                          </div>
                          <div className="text-xs text-gray-500">
                            ({porcentajeAhorro > 0 ? '-' : porcentajeAhorro < 0 ? '+' : ''}{Math.abs(porcentajeAhorro).toFixed(PERCENTAGE_DECIMALS)}%)
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/**
 * ProductPriceTable Component
 *
 * Tabla de productos agrupados por especie con precios personalizables.
 * Incluye accordions colapsables, modal de descuento y chips de seleccion.
 *
 * @param {Array} productos - Lista de productos disponibles
 * @param {Array} preciosSeleccionados - Precios ya configurados
 * @param {Function} onChange - Callback cuando cambian los precios
 */
const ProductPriceTable = ({ productos = [], preciosSeleccionados = [], onChange }) => {
  const [busqueda, setBusqueda] = useState('')
  const [errores, setErrores] = useState({})
  const [expandedSpecies, setExpandedSpecies] = useState({})
  const [showDiscountModal, setShowDiscountModal] = useState(false)

  // Filtrar productos por busqueda
  const productosFiltrados = useMemo(() =>
    productos.filter(p => {
      const nombreCompleto = PricingService.buildProductName(p).toLowerCase()
      return nombreCompleto.includes(busqueda.toLowerCase())
    }),
    [productos, busqueda]
  )

  // Agrupar productos filtrados por especie
  const productosPorEspecie = useMemo(() => {
    const grupos = {}
    productosFiltrados.forEach(producto => {
      const especie = producto.especie?.nombre || producto.nombreEspecie || DEFAULT_SPECIES_NAME
      if (!grupos[especie]) grupos[especie] = []
      grupos[especie].push(producto)
    })
    return Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b))
  }, [productosFiltrados])

  // Verificar si todos estan seleccionados
  const todosSeleccionados = productos.length > 0 &&
    preciosSeleccionados.filter(p => p.activo).length === productos.length

  // Verificar si todos los accordions estan expandidos
  const todosExpandidos = productosPorEspecie.length > 0 &&
    productosPorEspecie.every(([nombre]) => expandedSpecies[nombre] !== false)

  // Toggle accordion individual
  const toggleExpand = (especieNombre) => {
    setExpandedSpecies(prev => ({
      ...prev,
      [especieNombre]: prev[especieNombre] === false ? true : false
    }))
  }

  // Expandir/colapsar todos los accordions
  const toggleExpandAll = () => {
    const newState = {}
    productosPorEspecie.forEach(([nombre]) => {
      newState[nombre] = !todosExpandidos
    })
    setExpandedSpecies(newState)
  }

  // Manejar cambio en checkbox de activacion
  const handleToggleProducto = (productoId) => {
    const precioActual = preciosSeleccionados.find(p => p.productoId === productoId)
    const producto = productos.find(p => p.id === productoId)

    if (precioActual) {
      const nuevosPrecios = preciosSeleccionados.map(p =>
        p.productoId === productoId ? { ...p, activo: !p.activo } : p
      )
      onChange(nuevosPrecios)
    } else {
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

    const validacion = PricingService.validateCustomPrice(precioNumerico, producto.precioBase || producto.precioKilo || 0)

    if (!validacion.isValid && nuevoPrecio !== '') {
      setErrores({
        ...errores,
        [productoId]: validacion.error
      })
    } else {
      const nuevosErrores = { ...errores }
      delete nuevosErrores[productoId]
      setErrores(nuevosErrores)
    }

    const nuevosPrecios = preciosSeleccionados.map(p =>
      p.productoId === productoId
        ? { ...p, precioPersonalizado: nuevoPrecio === '' ? 0 : precioNumerico }
        : p
    )
    onChange(nuevosPrecios)
  }

  // Seleccionar/deseleccionar todos los productos
  const handleToggleAll = (seleccionar) => {
    if (seleccionar) {
      const todosSeleccionadosArr = productos.map(producto => {
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
      onChange(todosSeleccionadosArr)
    } else {
      const todosDeseleccionados = preciosSeleccionados.map(p => ({ ...p, activo: false }))
      onChange(todosDeseleccionados)
    }
  }

  // Seleccionar/deseleccionar todos por especie
  const handleToggleAllBySpecies = (especieNombre, seleccionar) => {
    const productosDeEspecie = productosFiltrados.filter(
      p => (p.especie?.nombre || p.nombreEspecie || DEFAULT_SPECIES_NAME) === especieNombre
    )

    if (seleccionar) {
      let nuevosPrecios = [...preciosSeleccionados]
      productosDeEspecie.forEach(producto => {
        const idx = nuevosPrecios.findIndex(p => p.productoId === producto.id)
        const precioBase = producto.precioBase || producto.precioKilo || 0
        if (idx >= 0) {
          nuevosPrecios[idx] = { ...nuevosPrecios[idx], activo: true }
        } else {
          nuevosPrecios.push({
            ...producto,
            id: producto.id,
            productoId: producto.id,
            nombreProducto: PricingService.buildProductName(producto),
            precioBase: precioBase,
            precioPersonalizado: precioBase,
            activo: true
          })
        }
      })
      onChange(nuevosPrecios)
    } else {
      const idsEspecie = new Set(productosDeEspecie.map(p => p.id))
      const nuevosPrecios = preciosSeleccionados.map(p =>
        idsEspecie.has(p.productoId) ? { ...p, activo: false } : p
      )
      onChange(nuevosPrecios)
    }
  }

  // Aplicar descuento global (recibe porcentaje del modal)
  const handleAplicarDescuentoGlobal = (porcentaje) => {
    const nuevosPrecios = preciosSeleccionados.map(p => {
      if (!p.activo) return p
      const producto = productos.find(prod => prod.id === p.productoId)
      const precioBase = producto?.precioBase || producto?.precioKilo || 0
      const precioConDescuento = precioBase * (1 - porcentaje / DISCOUNT_MAX)
      return {
        ...p,
        precioPersonalizado: Math.round(precioConDescuento * 100) / 100
      }
    })
    onChange(nuevosPrecios)
  }

  // Obtener precio configurado para un producto
  const getPrecioProducto = (productoId) => {
    return preciosSeleccionados.find(p => p.productoId === productoId)
  }

  const productosActivosCount = preciosSeleccionados.filter(p => p.activo).length

  return (
    <div className="space-y-3">
      {/* Header con busqueda y acciones */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Input
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="max-w-md"
        />
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={toggleExpandAll}
          >
            {todosExpandidos ? 'Colapsar Todos' : 'Expandir Todos'}
          </Button>
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
            onClick={() => setShowDiscountModal(true)}
            disabled={productosActivosCount === 0}
          >
            Aplicar Descuento Global
          </Button>
        </div>
      </div>

      {/* Chips de productos seleccionados */}
      <SelectedProductsChips
        preciosSeleccionados={preciosSeleccionados}
        productos={productos}
        onToggleProducto={handleToggleProducto}
      />

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>Selecciona los productos</strong> que este cliente puede comprar y asigna su <strong>precio especifico</strong>.
          Solo se guardaran los productos marcados.
        </p>
      </div>

      {/* Accordions por especie */}
      <div className="space-y-2">
        {productosPorEspecie.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border rounded-lg">
            {busqueda ? 'No se encontraron productos' : 'No hay productos disponibles'}
          </div>
        ) : (
          productosPorEspecie.map(([especieNombre, productosGrupo]) => (
            <SpeciesGroup
              key={especieNombre}
              especieNombre={especieNombre}
              productosGrupo={productosGrupo}
              preciosSeleccionados={preciosSeleccionados}
              isExpanded={expandedSpecies[especieNombre] !== false}
              onToggleExpand={() => toggleExpand(especieNombre)}
              onToggleProducto={handleToggleProducto}
              onToggleAllBySpecies={handleToggleAllBySpecies}
              onPrecioChange={handlePrecioChange}
              errores={errores}
              getPrecioProducto={getPrecioProducto}
            />
          ))
        )}
      </div>

      {/* Resumen */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Productos seleccionados:</p>
            <p className="text-2xl font-bold text-gray-900">
              {productosActivosCount} / {productos.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Ahorro promedio:</p>
            <p className="text-2xl font-bold text-green-600">
              {productosActivosCount > 0
                ? PricingService.calculateTotalSavings(
                    preciosSeleccionados
                      .filter(p => p.activo)
                      .map(p => ({
                        precioBase: p.precioBase,
                        precioPersonalizado: p.precioPersonalizado,
                        cantidad: 1
                      }))
                  ).porcentajePromedio.toFixed(PERCENTAGE_DECIMALS)
                : '0.0'}%
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Descuento */}
      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onApply={handleAplicarDescuentoGlobal}
        productosActivosCount={productosActivosCount}
      />
    </div>
  )
}

export default ProductPriceTable
