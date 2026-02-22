import { useState, useEffect, useMemo } from 'react'
import { productsService } from '@services/productsService'

/**
 * Hook para filtrado en cascada de productos: Especie → Medida → Presentación
 *
 * IMPORTANTE: Este hook usa GET /api/v1/products/for-orders que devuelve TODOS
 * los productos activos, incluyendo aquellos con visible_en_catalogo=false.
 * Esto permite que al crear pedidos se puedan seleccionar todos los productos.
 *
 * El catálogo público (CatalogoProductos) usa API-014 que sí filtra por visible_en_catalogo.
 *
 * Integrado con GET /api/v1/products/for-orders - Todos los productos para pedidos
 * Integrado con API-045 (GET /api/v1/species)
 * Integrado con API-049 (GET /api/v1/measures)
 * Integrado con API-053 (GET /api/v1/presentations)
 *
 * @param {Object} params
 * @param {string} params.especieId - ID de especie seleccionada
 * @param {string} params.medidaId - ID de medida seleccionada
 * @param {string} params.presentacionId - ID de presentación seleccionada
 * @param {number} params.customerId - ID del cliente (para obtener precios especiales)
 * @param {number} params.descuentoCliente - Descuento del cliente (0-1) [DEPRECATED - usar customerId]
 * @returns {Object} Opciones filtradas y producto seleccionado
 */
export const useProductFilters = ({
  especieId = '',
  medidaId = '',
  presentacionId = '',
  customerId = null,
  descuentoCliente = 0
} = {}) => {
  const [especies, setEspecies] = useState([])
  const [medidas, setMedidas] = useState([])
  const [presentaciones, setPresentaciones] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Cargar especies, medidas y presentaciones al montar
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [especiesRes, medidasRes, presentacionesRes] = await Promise.all([
          productsService.listEspecies(),
          productsService.listMedidas(),
          productsService.listPresentaciones()
        ])

        if (especiesRes.success) setEspecies(especiesRes.data)
        if (medidasRes.success) setMedidas(medidasRes.data)
        if (presentacionesRes.success) setPresentaciones(presentacionesRes.data)
      } catch (err) {
        console.error('Error cargando datos iniciales:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Cargar TODOS los productos activos para pedidos
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      setError(null)

      try {
        // Usar /products/for-orders que devuelve TODOS los productos activos
        // (no filtra por visible_en_catalogo como /catalog/products)
        // Si se proporciona customerId, aplica precios especiales del cliente
        const response = await productsService.listForOrders({
          speciesId: especieId || undefined,
          measureId: medidaId || undefined,
          customerId: customerId || undefined
        })

        if (response.success) {
          setProductos(response.data)
        } else {
          setError(response.error)
        }
      } catch (err) {
        console.error('Error cargando productos:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [especieId, medidaId, customerId]) // Depende de especieId, medidaId y customerId para filtrar productos y obtener precios

  // Opciones de especies (todas disponibles)
  const especiesOptions = useMemo(() => {
    return especies.map(e => ({
      value: e.id,
      label: e.name || e.nombre
    }))
  }, [especies])

  // Opciones de medidas filtradas por especie
  // Medida = unidad de referencia (Kilogramo, Unidad, etc.)
  const medidasOptions = useMemo(() => {
    if (!especieId) return []

    const productosEspecie = productos.filter(p => String(p.especieId) === String(especieId))
    // Normalizar IDs a strings para comparacion consistente
    const medidaIds = [...new Set(productosEspecie.map(p => String(p.medidaId)))]

    return medidas
      .filter(m => medidaIds.includes(String(m.id)))
      .map(m => ({
        value: m.id,
        label: m.name || m.nombre
      }))
  }, [especieId, productos, medidas])

  // Opciones de presentaciones filtradas por especie y medida
  // Presentacion = contenedor con peso (Bolsa 10kg, Saco 50kg, etc.)
  const presentacionesOptions = useMemo(() => {
    if (!especieId || !medidaId) return []

    const productosFiltrados = productos.filter(
      p => String(p.especieId) === String(especieId) &&
           String(p.medidaId) === String(medidaId)
    )

    // Normalizar IDs a strings para comparacion consistente
    const presentacionIds = [...new Set(productosFiltrados.map(p => String(p.presentacionId)))]

    return presentaciones
      .filter(p => presentacionIds.includes(String(p.id)))
      .map(p => ({
        value: p.id,
        // Presentacion ahora incluye el peso en kg
        label: `${p.name || p.nombre} (${p.weight || 1} kg)`
      }))
  }, [especieId, medidaId, productos, presentaciones])

  // Producto seleccionado con precio calculado
  const productoSeleccionado = useMemo(() => {
    if (!especieId || !medidaId || !presentacionId) {
      return null
    }

    const producto = productos.find(
      p => String(p.especieId) === String(especieId) &&
           String(p.medidaId) === String(medidaId) &&
           String(p.presentacionId) === String(presentacionId)
    )

    if (!producto) return null

    const especie = especies.find(e => String(e.id) === String(producto.especieId))
    const medida = medidas.find(m => String(m.id) === String(producto.medidaId))
    const presentacion = presentaciones.find(p => String(p.id) === String(producto.presentacionId))

    // Usar precio con descuento si existe, sino precio base
    // El API devuelve discountedPrice con el precio especial del cliente si existe
    const precioKg = producto.discountedPrice || producto.precioBaseKg || producto.basePrice || 0
    // Los kilos ahora vienen de presentacion.peso (presentationKilos del API)
    const kilosPorUnidad = producto.presentationKilos || presentacion?.weight || 1

    return {
      ...producto,
      especie: especie ? {
        id: especie.id,
        nombre: especie.name || especie.nombre
      } : null,
      medida: medida ? {
        id: medida.id,
        nombre: medida.name || medida.nombre,
        abreviatura: medida.abbreviation || medida.abreviatura
      } : null,
      presentacion: presentacion ? {
        id: presentacion.id,
        nombre: presentacion.name || presentacion.nombre,
        // kilos viene de presentacion.peso
        kilos: kilosPorUnidad
      } : null,
      precioKg,
      nombreCompleto: `${especie?.name || especie?.nombre || ''} ${medida?.name || medida?.nombre || ''} - ${presentacion?.name || presentacion?.nombre || ''}`
      // fotoUrl ya viene del mapProductFromAPI en productsService (imageUrl → fotoUrl)
    }
  }, [especieId, medidaId, presentacionId, productos, especies, medidas, presentaciones])

  return {
    especiesOptions,
    medidasOptions,
    presentacionesOptions,
    productoSeleccionado,
    productos,
    loading,
    error
  }
}
