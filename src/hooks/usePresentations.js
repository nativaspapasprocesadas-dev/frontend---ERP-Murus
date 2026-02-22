/**
 * usePresentations Hook
 * Hook para gestionar presentaciones con APIs reales
 * Integración: ELM-109, ELM-110, ELM-111, ELM-113
 * APIs: API-053 (GET /presentations), API-054 (POST /presentations),
 *       API-055 (PUT /presentations/{id}), API-056 (DELETE /presentations/{id})
 */
import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';

export const usePresentations = () => {
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Obtener lista de presentaciones - API-053
   * GET /api/v1/presentations
   */
  const fetchPresentations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/presentations');
      // response.data tiene estructura: { data: [...], pagination: {...} }
      // Mapear weight para asegurar que siempre tenga un valor
      const mapped = (response.data.data || []).map(p => ({
        ...p,
        weight: p.weight || 1
      }));
      setPresentations(mapped);
      return { success: true, data: mapped };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al cargar presentaciones';
      setError(errorMessage);
      console.error('Error en fetchPresentations:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar presentaciones al montar
  useEffect(() => {
    fetchPresentations();
  }, [fetchPresentations]);

  /**
   * Crear presentación - API-054
   * POST /api/v1/presentations
   * @param {Object} data - { name, description }
   */
  const createPresentation = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/presentations', data);
      // Refrescar lista después de crear
      await fetchPresentations();
      return {
        success: true,
        message: 'Presentación creada exitosamente',
        data: response.data
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al crear presentación';
      setError(errorMessage);
      console.error('Error en createPresentation:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchPresentations]);

  /**
   * Actualizar presentación - API-055
   * PUT /api/v1/presentations/{id}
   * @param {number} id - ID de la presentación
   * @param {Object} data - { name?, description?, isActive? }
   */
  const updatePresentation = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.put(`/presentations/${id}`, data);
      // Refrescar lista después de actualizar
      await fetchPresentations();
      return {
        success: true,
        message: 'Presentación actualizada exitosamente',
        data: response.data
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al actualizar presentación';
      setError(errorMessage);
      console.error('Error en updatePresentation:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchPresentations]);

  /**
   * Eliminar presentación - API-056
   * DELETE /api/v1/presentations/{id}
   * @param {number} id - ID de la presentación
   */
  const deletePresentation = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.delete(`/presentations/${id}`);
      // Refrescar lista después de eliminar
      await fetchPresentations();
      return {
        success: true,
        message: response.data.message || 'Presentación eliminada exitosamente'
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al eliminar presentación';
      setError(errorMessage);
      console.error('Error en deletePresentation:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchPresentations]);

  /**
   * Alternar estado activo/inactivo de una presentación
   * @param {number} id - ID de la presentación
   * @param {boolean} currentStatus - Estado actual (true=activa, false=inactiva)
   */
  const toggleStatus = useCallback(async (id, currentStatus) => {
    setLoading(true);
    setError(null);

    try {
      const payload = { isActive: !currentStatus };
      await apiClient.put(`/presentations/${id}`, payload);
      // Refrescar lista después de actualizar
      await fetchPresentations();
      return {
        success: true,
        message: currentStatus ? 'Presentación desactivada' : 'Presentación activada'
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al cambiar estado';
      setError(errorMessage);
      console.error('Error en toggleStatus presentation:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchPresentations]);

  return {
    presentations,
    loading,
    error,
    fetchPresentations,
    createPresentation,
    updatePresentation,
    deletePresentation,
    toggleStatus
  };
};
