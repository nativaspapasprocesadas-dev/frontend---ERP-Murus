/**
 * Hook para obtener detalle de producto desde API-015
 * GET /api/v1/catalog/products/{id}
 * Reemplaza useMockProductos en vista DetalleProducto
 */
import { useState, useEffect, useCallback } from 'react'
import apiClient from '@/lib/api'
import { toast } from 'sonner'

export const useProductDetail = (productId) => {
  const [loading, setLoading] = useState(true)
  const [producto, setProducto] = useState(null)
  const [error, setError] = useState(null)

  /**
   * Llamada a API-015: GET /api/v1/catalog/products/{id}
   * Response: ProductDetailDTO con campos:
   * - id, fullName, species, measure, presentation, basePrice, discountedPrice, kilos, imageUrl, isActive
   */
  const fetchProductDetail = useCallback(async () => {
    if (!productId) return

    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.get(`/catalog/products/${productId}`)

      // Backend NO retorna success wrapper, solo el objeto directo
      const product = response.data

      if (product && product.id) {

        // Mapeo de campos API -> frontend
        // Backend ahora retorna presentation.kilos desde el campo peso de la tabla presentaciones
        const kilosDefault = product.presentation?.kilos || 1
        const productoMapeado = {
          id: product.id,
          nombreCompleto: product.fullName,
          especie: product.species ? {
            id: product.species.id,
            nombre: product.species.name
          } : null,
          medida: product.measure ? {
            id: product.measure.id,
            nombre: product.measure.name
          } : null,
          presentacion: product.presentation ? {
            id: product.presentation.id,
            nombre: product.presentation.name,
            kilos: kilosDefault
          } : null,
          precioBaseKg: parseFloat(product.basePrice),
          precioTotal: parseFloat(product.basePrice) * kilosDefault,
          fotoUrl: product.imageUrl,
          activo: product.isActive,
          // Para cálculo de precios con descuento del cliente
          _precioConDescuento: parseFloat(product.discountedPrice)
        }

        setProducto(productoMapeado)
      } else {
        setError('Error al obtener el producto')
        toast.error('Error al obtener el producto')
      }
    } catch (err) {
      console.error('Error fetching product detail:', err)

      if (err.response?.status === 404) {
        setError('Producto no encontrado')
        toast.error('Producto no encontrado')
      } else if (err.response?.status === 403) {
        setError('No tiene permisos para ver este producto')
        toast.error('No tiene permisos para ver este producto')
      } else {
        setError('Error al cargar el producto')
        toast.error('Error al cargar el producto')
      }
      setProducto(null)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchProductDetail()
  }, [fetchProductDetail])

  return {
    producto,
    loading,
    error,
    refetch: fetchProductDetail
  }
}
