/**
 * useMeasures Hook
 * Hook para gestionar medidas con APIs reales
 * Integración: ELM-100, API-049, API-050, API-051, API-052
 */
import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';
import { getLocalDateTime } from '@utils/dateUtils';

export const useMeasures = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Mapear respuesta del backend al formato del frontend
   * Backend usa: name, abbreviation, conversionFactor, isActive
   * Frontend usa: nombre, tipo, activa, orden (tipo y orden son extensiones locales)
   */
  const mapFromAPI = useCallback((measure) => {
    return {
      id: measure.id,
      nombre: measure.name,
      tipo: measure.abbreviation || 'PERSONALIZADO', // Mapeo temporal
      activa: measure.isActive,
      orden: measure.id, // Usar id como orden temporal
      fechaCreacion: measure.createdAt || getLocalDateTime(),
    };
  }, []);

  /**
   * Mapear datos del frontend al formato del backend
   */
  const mapToAPI = useCallback((formData) => {
    return {
      name: formData.nombre,
      abbreviation: formData.tipo || '',
      conversionFactor: 1, // Valor por defecto
      isActive: formData.activa ?? true,
    };
  }, []);

  /**
   * Cargar todas las medidas - API-049
   * GET /api/v1/measures
   */
  const fetchMeasures = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/measures');
      const measures = response.data.data || [];
      setData(measures.map(mapFromAPI));
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al cargar medidas';
      setError(errorMessage);
      console.error('Error en fetchMeasures:', err);
    } finally {
      setLoading(false);
    }
  }, [mapFromAPI]);

  // Cargar medidas al montar el componente
  useEffect(() => {
    fetchMeasures();
  }, [fetchMeasures]);

  /**
   * Crear nueva medida - API-050
   * POST /api/v1/measures
   */
  const create = useCallback(async (formData) => {
    setLoading(true);
    setError(null);

    try {
      const payload = mapToAPI(formData);
      const response = await apiClient.post('/measures', payload);

      // Agregar la nueva medida al estado local
      const newMeasure = mapFromAPI(response.data);
      setData((prev) => [...prev, newMeasure]);

      return { success: true, data: newMeasure };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al crear medida';
      setError(errorMessage);
      console.error('Error en create measure:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [mapToAPI, mapFromAPI]);

  /**
   * Actualizar medida existente - API-051
   * PUT /api/v1/measures/{id}
   */
  const update = useCallback(async (id, formData) => {
    setLoading(true);
    setError(null);

    try {
      const payload = mapToAPI(formData);
      const response = await apiClient.put(`/measures/${id}`, payload);

      // Actualizar en el estado local
      const updatedMeasure = mapFromAPI(response.data);
      setData((prev) =>
        prev.map((item) => (item.id === id ? updatedMeasure : item))
      );

      return { success: true, data: updatedMeasure };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al actualizar medida';
      setError(errorMessage);
      console.error('Error en update measure:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [mapToAPI, mapFromAPI]);

  /**
   * Eliminar medida - API-052
   * DELETE /api/v1/measures/{id}
   */
  const remove = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.delete(`/measures/${id}`);

      // Eliminar del estado local
      setData((prev) => prev.filter((item) => item.id !== id));

      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al eliminar medida';
      setError(errorMessage);
      console.error('Error en remove measure:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener medida por ID
   */
  const getById = useCallback((id) => {
    return data.find((item) => item.id === id) || null;
  }, [data]);

  /**
   * Alternar estado activo/inactivo de una medida
   * @param {number} id - ID de la medida
   * @param {boolean} currentStatus - Estado actual (true=activa, false=inactiva)
   */
  const toggleStatus = useCallback(async (id, currentStatus) => {
    setLoading(true);
    setError(null);

    try {
      const payload = { isActive: !currentStatus };
      const response = await apiClient.put(`/measures/${id}`, payload);

      // Actualizar en el estado local
      const updatedMeasure = mapFromAPI(response.data);
      setData((prev) =>
        prev.map((item) => (item.id === id ? updatedMeasure : item))
      );

      return { success: true, data: updatedMeasure };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al cambiar estado';
      setError(errorMessage);
      console.error('Error en toggleStatus measure:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [mapFromAPI]);

  return {
    data,
    loading,
    error,
    create,
    update,
    remove,
    getById,
    toggleStatus,
    refresh: fetchMeasures,
  };
};
