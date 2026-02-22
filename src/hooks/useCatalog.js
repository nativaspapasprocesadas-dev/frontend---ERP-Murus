/**
 * Hook para obtener catálogo de productos desde API-014
 * GET /api/v1/catalog/products
 * Incluye especies y medidas para filtros desde APIs auxiliares
 * Reemplaza useMockProductos en vista CatalogoProductos
 */
import { useState, useEffect, useCallback } from 'react'
import apiClient from '@/lib/api'
import { toast } from 'sonner'

export const useCatalog = () => {
  const [loading, setLoading] = useState(true)
  const [productos, setProductos] = useState([])
  const [especies, setEspecies] = useState([])
  const [medidas, setMedidas] = useState([])
  const [filtros, setFiltros] = useState({
    especieId: '',
    medidaId: ''
  })

  /**
   * Llamada a API-014: GET /api/v1/catalog/products
   * Query params: speciesId, measureId, page, pageSize
   */
  const fetchProducts = useCallback(async () => {
    setLoading(true)

    try {
      const params = {}

      if (filtros.especieId) {
        params.speciesId = filtros.especieId
      }

      if (filtros.medidaId) {
        params.measureId = filtros.medidaId
      }

      const response = await apiClient.get('/catalog/products', { params })

      // Backend puede retornar { data: [...] } o solo [...]
      const productsList = response.data?.data || response.data || []

      // Mapeo de campos API -> frontend
      const productosMapeados = productsList.map(product => ({
        id: product.id,
        nombreCompleto: product.fullName || product.name,
        nombre: product.name,
        especieId: product.species?.id || product.speciesId,
        especie: product.species ? {
          id: product.species.id,
          nombre: product.species.name
        } : null,
        medidaId: product.measure?.id || product.measureId,
        medida: product.measure ? {
          id: product.measure.id,
          nombre: product.measure.name
        } : null,
        presentacionId: product.presentation?.id || product.presentationId,
        presentacion: product.presentation ? {
          id: product.presentation.id,
          nombre: product.presentation.name,
          kilos: product.presentation.kilos || 10
        } : null,
        precioBaseKg: parseFloat(product.basePrice || 0),
        precioTotal: parseFloat(product.basePrice || 0) * (product.presentation?.kilos || 10),
        _precioConDescuento: product.discountedPrice ? parseFloat(product.discountedPrice) : null,
        fotoUrl: product.imageUrl,
        activo: product.isActive !== false,
        enCatalogo: true // Si vino de /catalog/products, está visible
      }))

      setProductos(productosMapeados)
    } catch (error) {
      console.error('Error fetching catalog products:', error)

      if (error.response?.status === 403) {
        toast.error('No tiene permisos para acceder al catálogo')
      } else {
        toast.error('Error al cargar el catálogo')
      }
      setProductos([])
    } finally {
      setLoading(false)
    }
  }, [filtros])

  /**
   * Cargar especies para filtros (GET /api/v1/catalog/species)
   */
  const fetchSpecies = useCallback(async () => {
    try {
      const response = await apiClient.get('/catalog/species')
      const speciesList = response.data?.data || response.data || []

      const especiesMapeadas = speciesList.map(s => ({
        id: s.id,
        nombre: s.name,
        activa: true // Solo se retornan activas
      }))

      setEspecies(especiesMapeadas)
    } catch (error) {
      console.error('Error fetching species:', error)
      setEspecies([])
    }
  }, [])

  /**
   * Cargar medidas para filtros (GET /api/v1/catalog/measures)
   */
  const fetchMeasures = useCallback(async () => {
    try {
      const response = await apiClient.get('/catalog/measures')
      const measuresList = response.data?.data || response.data || []

      const medidasMapeadas = measuresList.map(m => ({
        id: m.id,
        nombre: m.name,
        activa: true // Solo se retornan activas
      }))

      setMedidas(medidasMapeadas)
    } catch (error) {
      console.error('Error fetching measures:', error)
      setMedidas([])
    }
  }, [])

  // Cargar todo al montar
  useEffect(() => {
    fetchSpecies()
    fetchMeasures()
  }, [fetchSpecies, fetchMeasures])

  // Recargar productos cuando cambien filtros
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const limpiarFiltros = () => {
    setFiltros({
      especieId: '',
      medidaId: ''
    })
  }

  return {
    productos,
    productosVisiblesEnCatalogo: productos, // Alias para compatibilidad
    especies,
    medidas,
    filtros,
    setFiltros,
    limpiarFiltros,
    loading,
    refetch: fetchProducts
  }
}
