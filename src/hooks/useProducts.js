/**
 * useProducts Hook
 * Hook para gestionar productos con APIs reales
 * Integración: API-014 (GET /catalog/products)
 */
import { useState, useCallback } from 'react';
import apiClient from '@/lib/api';

export const useProducts = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Mapear respuesta del backend al formato del frontend
   * IMPORTANTE: Los campos nombreEspecie, nombreMedida y precioBase son necesarios
   * para PricingService.buildProductName() y ProductPriceTable
   */
  const mapFromAPI = useCallback((product) => {
    // Obtener kilos de presentación
    const kilosPresentacion = product.presentationKilos || product.presentation?.kilos || 1;

    return {
      id: product.id,
      codigo: product.code || '',
      nombre: product.name || '',
      nombreCompleto: product.fullName || product.name || '',
      // Campos para PricingService.buildProductName()
      nombreEspecie: product.species || '',
      nombreMedida: product.measure || '',
      nombrePresentacion: product.presentation || '',
      // Objetos con nombre para compatibilidad con ModalPedidoAdicional y otros componentes
      especie: {
        id: product.speciesId || product.especieId || null,
        nombre: product.species || ''
      },
      especieId: product.speciesId || product.especieId || null,
      medida: {
        id: product.measureId || product.medidaId || null,
        nombre: product.measure || '',
        abreviatura: product.measureAbbr || ''
      },
      medidaId: product.measureId || product.medidaId || null,
      presentacion: {
        id: product.presentationId || product.presentacionId || null,
        nombre: product.presentation || '',
        kilos: kilosPresentacion
      },
      presentacionId: product.presentationId || product.presentacionId || null,
      presentationKilos: kilosPresentacion,
      // Precios - múltiples alias para compatibilidad
      precioBase: product.basePrice || product.precioBaseKg || 0,
      precioBaseKg: product.basePrice || product.precioBaseKg || 0,
      precioKilo: product.basePrice || product.precioBaseKg || 0,
      precioEstandar: product.basePrice || 0,
      precioPersonalizado: product.discountedPrice || product.customPrice || product.basePrice || 0,
      precioConDescuento: product.discountedPrice || product.customPrice || null,
      imageUrl: product.imageUrl || '',
      activo: product.isActive !== false,
      mostrarEnCatalogo: product.showInCatalog !== false,
      descripcion: product.description || '',
    };
  }, []);

  /**
   * API-014: Listar productos del catalogo
   * GET /api/v1/catalog/products
   * @param {Object} filters - Filtros opcionales
   * @param {boolean} filters.includeHidden - Si es true, incluye productos no visibles en catálogo (para uso administrativo)
   */
  const fetchProducts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filters.speciesId) params.append('speciesId', filters.speciesId);
      if (filters.measureId) params.append('measureId', filters.measureId);
      if (filters.page) params.append('page', filters.page);
      if (filters.pageSize) params.append('pageSize', filters.pageSize);
      // Parámetro para incluir productos no visibles en catálogo (solo admin)
      if (filters.includeHidden) params.append('includeHidden', 'true');

      const response = await apiClient.get(`/catalog/products?${params.toString()}`);
      const products = response.data.data || [];
      const mappedData = products.map(mapFromAPI);
      setData(mappedData);

      return {
        success: true,
        data: mappedData,
        pagination: response.data.pagination,
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al cargar productos';
      setError(errorMessage);
      console.error('Error en fetchProducts:', err);
      return { success: false, error: errorMessage, data: [] };
    } finally {
      setLoading(false);
    }
  }, [mapFromAPI]);

  /**
   * Obtener producto por ID (desde cache local)
   */
  const getById = useCallback((id) => {
    return data.find((item) => item.id === id) || null;
  }, [data]);

  /**
   * Obtener productos visibles en catalogo
   */
  const getCatalogProducts = useCallback(() => {
    return data.filter((product) => product.activo && product.mostrarEnCatalogo);
  }, [data]);

  return {
    // Estado
    data,
    productosExpandidos: data, // Alias para compatibilidad con codigo existente
    loading,
    error,

    // Operaciones
    fetchProducts,
    refresh: fetchProducts,

    // Helpers
    getById,
    getCatalogProducts,
  };
};
