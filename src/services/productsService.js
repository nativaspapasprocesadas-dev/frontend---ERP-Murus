/**
 * ProductsService - Servicio para operaciones CRUD de productos
 * Integración con APIs reales:
 * - API-057: GET /api/v1/products (listar productos)
 * - API-058: POST /api/v1/products (crear producto)
 * - API-059: PUT /api/v1/products/:id (actualizar producto)
 * - API-060: DELETE /api/v1/products/:id (eliminar producto)
 * - API-045: GET /api/v1/species (listar especies)
 * - API-049: GET /api/v1/measures (listar medidas)
 * - API-053: GET /api/v1/presentations (listar presentaciones)
 */
import apiClient from '@/lib/api'

/**
 * Mapea producto del backend al formato del frontend
 * Soporta tanto API CRUD (/products) como API Catalog (/catalog/products)
 * - API CRUD devuelve: speciesId, measureId, presentationId, species{}, measure{}, presentation{}
 * - API Catalog devuelve: especieId, medidaId, presentacionId (ya en espanol)
 */
const mapProductFromAPI = (product) => {
  // Obtener IDs asegurando que sean números
  // Soportar ambos formatos: especieId (catalog) y speciesId (crud)
  const especieId = product.especieId ?? product.species?.id ?? product.speciesId ?? null
  const medidaId = product.medidaId ?? product.measure?.id ?? product.measureId ?? null
  const presentacionId = product.presentacionId ?? product.presentation?.id ?? product.presentationId ?? null

  return {
    id: product.id,
    codigo: product.code || '',
    nombre: product.name || '',
    nombreCompleto: product.name || '',
    // IDs como números para consistencia
    especieId: especieId ? Number(especieId) : null,
    medidaId: medidaId ? Number(medidaId) : null,
    presentacionId: presentacionId ? Number(presentacionId) : null,
    // Objetos relacionados con nombre correcto
    especie: product.species ? {
      id: Number(product.species.id),
      nombre: product.species.name || product.species.nombre || '-'
    } : (product.species ? { id: Number(especieId), nombre: product.species } : null),
    medida: product.measure ? {
      id: Number(product.measure.id),
      nombre: product.measure.name || product.measure.nombre || '-',
      abreviatura: product.measure.abbreviation || product.measure.abreviatura || ''
    } : (product.measure ? { id: Number(medidaId), nombre: product.measure } : null),
    presentacion: product.presentation ? {
      id: Number(product.presentation.id),
      nombre: product.presentation.name || product.presentation.nombre || '-',
      kilos: product.presentation.kilos || product.presentationKilos || 1
    } : (product.presentation ? { id: Number(presentacionId), nombre: product.presentation, kilos: 1 } : null),
    // Campos de precio - soportar ambos formatos
    precioBaseKg: product.precioBaseKg ?? (product.basePrice ? parseFloat(product.basePrice) : 0),
    basePrice: product.basePrice ? parseFloat(product.basePrice) : 0,
    discountedPrice: product.discountedPrice ? parseFloat(product.discountedPrice) : 0,
    presentationKilos: product.presentationKilos || 1,
    stockActual: product.stock ?? (product.currentStock ? parseFloat(product.currentStock) : 0),
    stockMinimo: product.minStock ? parseFloat(product.minStock) : 0,
    activo: product.isActive !== false,
    mostrarEnCatalogo: product.showInCatalog !== false,
    fotoUrl: product.imageUrl || product.fotoUrl || null,
    createdAt: product.createdAt || null
  }
}

/**
 * Mapea producto del frontend al formato del backend (para crear/actualizar)
 */
const mapProductToAPI = (producto) => {
  return {
    name: producto.nombre,
    code: producto.codigo,
    speciesId: parseInt(producto.especieId),
    measureId: parseInt(producto.medidaId),
    presentationId: parseInt(producto.presentacionId),
    basePrice: parseFloat(producto.precioBaseKg),
    isActive: producto.activo,
    showInCatalog: producto.mostrarEnCatalogo,
    imageUrl: producto.fotoUrl || null,
    stockMinimo: producto.stockMinimo ? parseFloat(producto.stockMinimo) : undefined
  }
}

export const productsService = {
  /**
   * API-057: Listar productos
   * GET /api/v1/products
   * Soporta filtros: page, pageSize, speciesId, measureId, presentationId, isActive, showInCatalog, search
   */
  async list(filters = {}) {
    try {
      const params = new URLSearchParams()

      if (filters.page) params.append('page', filters.page)
      if (filters.pageSize) params.append('pageSize', filters.pageSize)
      if (filters.speciesId) params.append('speciesId', filters.speciesId)
      if (filters.measureId) params.append('measureId', filters.measureId)
      if (filters.presentationId) params.append('presentationId', filters.presentationId)
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive)
      if (filters.showInCatalog !== undefined) params.append('showInCatalog', filters.showInCatalog)
      if (filters.search) params.append('search', filters.search)

      const response = await apiClient.get(`/products?${params.toString()}`)

      return {
        success: true,
        data: response.data.data.map(mapProductFromAPI),
        pagination: response.data.pagination
      }
    } catch (error) {
      console.error('Error en productsService.list:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al listar productos',
        data: [],
        pagination: null
      }
    }
  },

  /**
   * Subir imagen de producto
   * POST /api/v1/products/:id/image
   * @param {number} productId - ID del producto
   * @param {File} file - Archivo de imagen
   */
  async uploadImage(productId, file) {
    try {
      const formData = new FormData()
      formData.append('imagen', file)

      const response = await apiClient.post(`/products/${productId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      return {
        success: true,
        imageUrl: response.data.imageUrl,
        product: response.data.product
      }
    } catch (error) {
      console.error('Error en productsService.uploadImage:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al subir imagen'
      }
    }
  },

  /**
   * API-058: Crear producto
   * POST /api/v1/products
   */
  async create(productoData) {
    try {
      const payload = {
        speciesId: parseInt(productoData.especieId),
        measureId: parseInt(productoData.medidaId),
        presentationId: parseInt(productoData.presentacionId),
        basePrice: parseFloat(productoData.precioBaseKg),
        name: productoData.nombre?.trim() || undefined,
        code: productoData.codigo?.trim() || undefined,
        isActive: productoData.activo !== undefined ? productoData.activo : true,
        showInCatalog: productoData.mostrarEnCatalogo !== undefined ? productoData.mostrarEnCatalogo : true
      }

      const response = await apiClient.post('/products', payload)

      return {
        success: true,
        data: mapProductFromAPI(response.data)
      }
    } catch (error) {
      console.error('Error en productsService.create:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al crear producto'
      }
    }
  },

  /**
   * API-059: Actualizar producto
   * PUT /api/v1/products/:id
   */
  async update(id, productoData) {
    try {
      const payload = {}

      if (productoData.precioBaseKg !== undefined) {
        payload.basePrice = parseFloat(productoData.precioBaseKg)
      }
      if (productoData.activo !== undefined) {
        payload.isActive = productoData.activo
      }
      if (productoData.nombre !== undefined) {
        payload.name = productoData.nombre.trim()
      }
      if (productoData.stockMinimo !== undefined) {
        payload.stockMinimo = parseFloat(productoData.stockMinimo)
      }
      if (productoData.mostrarEnCatalogo !== undefined) {
        payload.showInCatalog = productoData.mostrarEnCatalogo
      }

      const response = await apiClient.put(`/products/${id}`, payload)

      return {
        success: true,
        data: mapProductFromAPI(response.data)
      }
    } catch (error) {
      console.error('Error en productsService.update:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al actualizar producto'
      }
    }
  },

  /**
   * API-060: Eliminar producto
   * DELETE /api/v1/products/:id
   */
  async delete(id) {
    try {
      const response = await apiClient.delete(`/products/${id}`)

      return {
        success: response.data.success || true,
        message: response.data.message || 'Producto eliminado correctamente'
      }
    } catch (error) {
      console.error('Error en productsService.delete:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al eliminar producto'
      }
    }
  },

  /**
   * API-045: Listar especies
   * GET /api/v1/species
   */
  async listEspecies() {
    try {
      const response = await apiClient.get('/species')
      return {
        success: true,
        data: response.data.data || []
      }
    } catch (error) {
      console.error('Error en productsService.listEspecies:', error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }
  },

  /**
   * API-049: Listar medidas
   * GET /api/v1/measures
   */
  async listMedidas() {
    try {
      const response = await apiClient.get('/measures')
      return {
        success: true,
        data: response.data.data || []
      }
    } catch (error) {
      console.error('Error en productsService.listMedidas:', error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }
  },

  /**
   * API-053: Listar presentaciones
   * GET /api/v1/presentations
   */
  async listPresentaciones() {
    try {
      const response = await apiClient.get('/presentations')
      return {
        success: true,
        data: response.data.data || []
      }
    } catch (error) {
      console.error('Error en productsService.listPresentaciones:', error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }
  },

  /**
   * API-014: Listar productos del catalogo
   * GET /api/v1/catalog/products
   * Retorna productos con precios personalizados segun descuento del cliente
   * NOTA: Solo devuelve productos con visible_en_catalogo = true
   */
  async listCatalog(filters = {}) {
    try {
      const params = new URLSearchParams()

      if (filters.speciesId) params.append('speciesId', filters.speciesId)
      if (filters.measureId) params.append('measureId', filters.measureId)
      if (filters.page) params.append('page', filters.page)
      if (filters.pageSize) params.append('pageSize', filters.pageSize)

      const response = await apiClient.get(`/catalog/products?${params.toString()}`)

      return {
        success: true,
        data: response.data.data.map(mapProductFromAPI),
        pagination: response.data.pagination
      }
    } catch (error) {
      console.error('Error en productsService.listCatalog:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al listar catalogo de productos',
        data: [],
        pagination: null
      }
    }
  },

  /**
   * Listar productos para pedidos
   * GET /api/v1/products/for-orders
   * Devuelve TODOS los productos activos (sin filtrar por visible_en_catalogo)
   * Si se proporciona customerId, aplica precios especiales del cliente
   */
  async listForOrders(filters = {}) {
    try {
      const params = new URLSearchParams()

      if (filters.speciesId) params.append('speciesId', filters.speciesId)
      if (filters.measureId) params.append('measureId', filters.measureId)
      if (filters.customerId) params.append('customerId', filters.customerId)

      const response = await apiClient.get(`/products/for-orders?${params.toString()}`)

      return {
        success: true,
        data: response.data.data.map(mapProductFromAPI)
      }
    } catch (error) {
      console.error('Error en productsService.listForOrders:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al listar productos para pedidos',
        data: []
      }
    }
  }
}
