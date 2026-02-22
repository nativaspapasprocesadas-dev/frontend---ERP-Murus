/**
 * useProductsAdmin Hook
 * Hook para gestionar productos en admin con APIs reales
 * Integración: API-057, API-058, API-059, API-060, API-045, API-049, API-053
 * Reemplaza useMockProductos
 */
import { useState, useCallback, useMemo, useEffect } from 'react'
import { productsService } from '@/services/productsService'
import { ProductService } from '@/services/ProductService'
import { toast } from 'react-toastify'

export const useProductsAdmin = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [especies, setEspecies] = useState([])
  const [medidas, setMedidas] = useState([])
  const [presentaciones, setPresentaciones] = useState([])

  // Estado de paginación
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 15,
    total: 0,
    totalPages: 0
  })

  // Estado de filtros
  const [filters, setFilters] = useState({
    speciesId: '',
    measureId: '',
    presentationId: '',
    isActive: '',
    showInCatalog: '',
    search: ''
  })

  /**
   * Cargar productos con paginación y filtros
   */
  const fetchData = useCallback(async (overrideFilters = {}) => {
    setLoading(true)
    setError(null)

    // Usar página actual si no se especifica
    const page = overrideFilters.page || pagination.page
    const pageSize = overrideFilters.pageSize || pagination.pageSize

    // Combinar filtros actuales con filtros de override
    const activeFilters = { ...filters, ...overrideFilters }

    // Construir objeto de filtros para la API (solo incluir valores no vacíos)
    const apiFilters = {
      page,
      pageSize,
      ...(activeFilters.speciesId && { speciesId: activeFilters.speciesId }),
      ...(activeFilters.measureId && { measureId: activeFilters.measureId }),
      ...(activeFilters.presentationId && { presentationId: activeFilters.presentationId }),
      ...(activeFilters.isActive !== '' && { isActive: activeFilters.isActive === 'true' }),
      ...(activeFilters.showInCatalog !== '' && { showInCatalog: activeFilters.showInCatalog === 'true' }),
      ...(activeFilters.search && { search: activeFilters.search })
    }

    const result = await productsService.list(apiFilters)

    if (result.success) {
      setData(result.data)
      // Actualizar paginación si viene del backend
      if (result.pagination) {
        setPagination(prev => ({
          ...prev,
          page: result.pagination.page || page,
          pageSize: result.pagination.pageSize || pageSize,
          total: result.pagination.total || result.data.length,
          totalPages: result.pagination.totalPages || Math.ceil((result.pagination.total || result.data.length) / pageSize)
        }))
      }
    } else {
      setError(result.error)
      toast.error(result.error)
    }

    setLoading(false)
    return result
  }, [pagination.page, pagination.pageSize, filters])

  /**
   * Cargar datos auxiliares (especies, medidas, presentaciones)
   */
  const fetchAuxData = useCallback(async () => {
    const [especiesRes, medidasRes, presentacionesRes] = await Promise.all([
      productsService.listEspecies(),
      productsService.listMedidas(),
      productsService.listPresentaciones()
    ])

    if (especiesRes.success) setEspecies(especiesRes.data)
    if (medidasRes.success) setMedidas(medidasRes.data)
    if (presentacionesRes.success) setPresentaciones(presentacionesRes.data)
  }, [])

  /**
   * Crear producto
   */
  const create = useCallback(async (productoData) => {
    setLoading(true)

    // Separar el archivo de imagen del resto de datos
    const { imageFile, ...productDataWithoutImage } = productoData

    const result = await productsService.create(productDataWithoutImage)

    if (result.success) {
      // Si hay imagen, subirla después de crear el producto
      if (imageFile && imageFile instanceof File) {
        const uploadResult = await productsService.uploadImage(result.data.id, imageFile)
        if (!uploadResult.success) {
          toast.warning('Producto creado, pero hubo un error al subir la imagen')
        }
      }

      toast.success('Producto creado correctamente')
      await fetchData()
    } else {
      toast.error(result.error)
    }

    setLoading(false)
    return result
  }, [fetchData])

  /**
   * Actualizar producto
   */
  const update = useCallback(async (id, productoData) => {
    setLoading(true)

    // Separar el archivo de imagen del resto de datos
    const { imageFile, ...productDataWithoutImage } = productoData

    const result = await productsService.update(id, productDataWithoutImage)

    if (result.success) {
      // Si hay imagen nueva, subirla
      if (imageFile && imageFile instanceof File) {
        const uploadResult = await productsService.uploadImage(id, imageFile)
        if (!uploadResult.success) {
          toast.warning('Producto actualizado, pero hubo un error al subir la imagen')
        }
      }

      toast.success('Producto actualizado correctamente')
      await fetchData()
    } else {
      toast.error(result.error)
    }

    setLoading(false)
    return result
  }, [fetchData])

  /**
   * Subir imagen de producto
   */
  const uploadImage = useCallback(async (productId, file) => {
    if (!(file instanceof File)) {
      toast.error('Debe proporcionar un archivo válido')
      return { success: false, error: 'Archivo inválido' }
    }

    setLoading(true)
    const result = await productsService.uploadImage(productId, file)

    if (result.success) {
      toast.success('Imagen subida correctamente')
      await fetchData()
    } else {
      toast.error(result.error)
    }

    setLoading(false)
    return result
  }, [fetchData])

  /**
   * Eliminar producto
   */
  const remove = useCallback(async (id) => {
    setLoading(true)
    const result = await productsService.delete(id)

    if (result.success) {
      toast.success('Producto eliminado correctamente')
      await fetchData()
    } else {
      // Errores de validación tienen mayor duración para poder leer el mensaje completo
      toast.error(result.error, { autoClose: 8000 })
    }

    setLoading(false)
    return result
  }, [fetchData])

  /**
   * Toggle de visibilidad en catálogo
   * Actualiza solo el producto en el estado local sin recargar toda la lista
   * para evitar que la pantalla se desplace hacia arriba
   */
  const toggleCatalogVisibility = useCallback(async (productoId) => {
    const producto = data.find(p => p.id === productoId)
    if (!producto) {
      throw new Error('Producto no encontrado')
    }

    const nuevoEstado = !producto.mostrarEnCatalogo

    // Validar el cambio antes de aplicarlo
    if (nuevoEstado) {
      const validation = ProductService.validateCatalogVisibilityChange(producto)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }

    // Llamar directamente al servicio sin usar update() para evitar fetchData()
    const result = await productsService.update(productoId, {
      mostrarEnCatalogo: nuevoEstado
    })

    if (result.success) {
      // Actualizar solo el producto en el estado local (sin recargar toda la lista)
      setData(prevData => prevData.map(p =>
        p.id === productoId
          ? { ...p, mostrarEnCatalogo: nuevoEstado }
          : p
      ))
      toast.success(nuevoEstado ? 'Producto visible en catálogo' : 'Producto oculto del catálogo')
    } else {
      toast.error(result.error || 'Error al cambiar visibilidad')
    }

    return result
  }, [data])

  /**
   * Productos con información expandida (con joins)
   */
  const productosExpandidos = useMemo(() => {
    return data.map((producto) => {
      // Buscar datos relacionados (IDs como números para comparación)
      const especieId = Number(producto.especieId)
      const medidaId = Number(producto.medidaId)
      const presentacionId = Number(producto.presentacionId)

      const especie = especies.find(e => Number(e.id) === especieId)
      const medida = medidas.find(m => Number(m.id) === medidaId)
      const presentacion = presentaciones.find(p => Number(p.id) === presentacionId)

      // Los kilos ahora vienen de presentacion.weight (peso en BD)
      const kilosPorUnidad = presentacion?.weight || producto.presentation?.kilos || 1

      // Construir objeto enriquecido
      return {
        ...producto,
        especie: especie ? { id: especie.id, nombre: especie.name || especie.nombre } : producto.especie || { id: especieId, nombre: '-' },
        medida: medida ? { id: medida.id, nombre: medida.name || medida.nombre } : producto.medida || { id: medidaId, nombre: '-' },
        presentacion: presentacion ? { id: presentacion.id, nombre: presentacion.name || presentacion.nombre, kilos: kilosPorUnidad } : producto.presentacion || { id: presentacionId, nombre: '-', kilos: 1 },
        nombreCompleto: producto.nombreCompleto || producto.nombre || `${especie?.name || especie?.nombre || ''} ${medida?.name || medida?.nombre || ''} ${presentacion?.name || presentacion?.nombre || ''}`.trim(),
        precioTotal: producto.precioBaseKg * kilosPorUnidad
      }
    })
  }, [data, especies, medidas, presentaciones])

  /**
   * Productos activos
   */
  const productosActivos = useMemo(() => {
    return productosExpandidos.filter(p => p.activo)
  }, [productosExpandidos])

  /**
   * Productos visibles en catálogo
   */
  const productosVisiblesEnCatalogo = useMemo(() => {
    return ProductService.filterCatalogProducts(productosExpandidos)
  }, [productosExpandidos])

  /**
   * Estadísticas de catálogo
   */
  const catalogStats = useMemo(() => {
    return ProductService.getCatalogStats(productosExpandidos)
  }, [productosExpandidos])

  /**
   * Obtener productos por especie
   */
  const getProductosByEspecie = useCallback((especieId) => {
    return productosExpandidos.filter(p => p.especieId === especieId)
  }, [productosExpandidos])

  /**
   * Obtener productos por medida
   */
  const getProductosByMedida = useCallback((medidaId) => {
    return productosExpandidos.filter(p => p.medidaId === medidaId)
  }, [productosExpandidos])

  /**
   * Obtener productos por presentación
   */
  const getProductosByPresentacion = useCallback((presentacionId) => {
    return productosExpandidos.filter(p => p.presentacionId === presentacionId)
  }, [productosExpandidos])

  /**
   * Obtener producto específico por combinación
   */
  const getProducto = useCallback((especieId, medidaId, presentacionId) => {
    return productosExpandidos.find(
      p => p.especieId === especieId && p.medidaId === medidaId && p.presentacionId === presentacionId
    )
  }, [productosExpandidos])

  /**
   * Navegar a una página específica
   */
  const goToPage = useCallback(async (page) => {
    if (page < 1 || page > pagination.totalPages) return
    setPagination(prev => ({ ...prev, page }))
    await fetchData({ page })
  }, [fetchData, pagination.totalPages])

  /**
   * Ir a la página siguiente
   */
  const nextPage = useCallback(async () => {
    if (pagination.page < pagination.totalPages) {
      await goToPage(pagination.page + 1)
    }
  }, [goToPage, pagination.page, pagination.totalPages])

  /**
   * Ir a la página anterior
   */
  const prevPage = useCallback(async () => {
    if (pagination.page > 1) {
      await goToPage(pagination.page - 1)
    }
  }, [goToPage, pagination.page])

  /**
   * Cambiar tamaño de página
   */
  const setPageSize = useCallback(async (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }))
    await fetchData({ page: 1, pageSize: newPageSize })
  }, [fetchData])

  /**
   * Actualizar un filtro específico
   */
  const updateFilter = useCallback((filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }))
  }, [])

  /**
   * Aplicar filtros actuales (reinicia a página 1)
   */
  const applyFilters = useCallback(async (newFilters = {}) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
    await fetchData({ ...updatedFilters, page: 1 })
  }, [filters, fetchData])

  /**
   * Limpiar todos los filtros
   */
  const clearFilters = useCallback(async () => {
    const emptyFilters = {
      speciesId: '',
      measureId: '',
      presentationId: '',
      isActive: '',
      showInCatalog: '',
      search: ''
    }
    setFilters(emptyFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
    await fetchData({ page: 1 })
  }, [fetchData])

  // Auto-cargar datos al montar
  useEffect(() => {
    fetchData({ page: 1 })
    fetchAuxData()
  }, []) // Solo al montar, sin dependencias para evitar loops

  return {
    // Estado
    data,
    productosExpandidos,
    productosActivos,
    productosVisiblesEnCatalogo,
    loading,
    error,

    // Paginación
    pagination,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,

    // Filtros
    filters,
    updateFilter,
    applyFilters,
    clearFilters,

    // Operaciones CRUD
    create,
    update,
    remove,
    refresh: fetchData,

    // Operaciones de imagen
    uploadImage,

    // Acciones especiales
    toggleCatalogVisibility,

    // Helpers
    getProductosByEspecie,
    getProductosByMedida,
    getProductosByPresentacion,
    getProducto,
    catalogStats,

    // Datos auxiliares
    especies,
    medidas,
    presentaciones
  }
}
