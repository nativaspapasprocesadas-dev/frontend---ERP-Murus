/**
 * CatalogService - Servicio para consumir API de catálogo de productos
 *
 * APIs implementadas:
 * - API-014: GET /api/v1/catalog/products (listar productos del catálogo)
 * - API-015: GET /api/v1/catalog/products/:id (detalle de producto)
 *
 * Según documentación: docs/integracion/04_apis_lista.md (líneas 891-1045)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4020/api/v1'
const CATALOG_ENDPOINT = `${API_BASE_URL}/catalog`

/**
 * Helper para hacer peticiones con token JWT
 */
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('auth_token')

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * API-014: GET /api/v1/catalog/products
 * Listar productos del catálogo con precios personalizados según descuento del cliente
 *
 * @param {Object} params
 * @param {number} params.page - Página actual
 * @param {number} params.pageSize - Tamaño de página
 * @param {number} params.speciesId - Filtro por especie
 * @param {number} params.measureId - Filtro por medida
 * @param {number} params.customerId - ID del cliente para obtener precios personalizados
 * @returns {Promise<Object>} Lista de productos con precios
 */
export const listCatalogProducts = async ({ page = 1, pageSize = 100, speciesId, measureId, customerId } = {}) => {
  const params = new URLSearchParams()

  if (page) params.append('page', page)
  if (pageSize) params.append('pageSize', pageSize)
  if (speciesId) params.append('speciesId', speciesId)
  if (measureId) params.append('measureId', measureId)
  if (customerId) params.append('customerId', customerId)

  const url = `${CATALOG_ENDPOINT}/products?${params.toString()}`
  return await fetchWithAuth(url, { method: 'GET' })
}

/**
 * API-015: GET /api/v1/catalog/products/:id
 * Obtener detalle de un producto del catálogo
 *
 * @param {number} productId - ID del producto
 * @returns {Promise<Object>} Detalle del producto
 */
export const getCatalogProductById = async (productId) => {
  const url = `${CATALOG_ENDPOINT}/products/${productId}`
  return await fetchWithAuth(url, { method: 'GET' })
}

/**
 * Helper: Listar especies (auxiliar para filtros)
 * GET /api/v1/catalog/species
 */
export const listCatalogSpecies = async () => {
  const url = `${CATALOG_ENDPOINT}/species`
  return await fetchWithAuth(url, { method: 'GET' })
}

/**
 * Helper: Listar medidas (auxiliar para filtros)
 * GET /api/v1/catalog/measures
 */
export const listCatalogMeasures = async () => {
  const url = `${CATALOG_ENDPOINT}/measures`
  return await fetchWithAuth(url, { method: 'GET' })
}

/**
 * Helper: Listar presentaciones (auxiliar para filtros)
 * GET /api/v1/catalog/presentations
 */
export const listCatalogPresentations = async () => {
  const url = `${CATALOG_ENDPOINT}/presentations`
  return await fetchWithAuth(url, { method: 'GET' })
}

export default {
  listCatalogProducts,
  getCatalogProductById,
  listCatalogSpecies,
  listCatalogMeasures,
  listCatalogPresentations
}
