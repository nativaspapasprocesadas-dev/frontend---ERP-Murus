/**
 * useProfile Hook
 * Hook para gestionar perfil de usuario con APIs reales
 * Integración: ELM-105, API-075 (GET /profile), API-076 (POST /profile/change-password)
 */
import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Obtener perfil del usuario actual - API-075
   * GET /api/v1/profile
   */
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/profile');
      // Backend devuelve { success, data: { id, name, email, ... } }
      // Extraer el objeto data interno con los datos del perfil
      const profileData = response.data?.data || response.data;
      setProfile(profileData);
      return { success: true, data: profileData };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al cargar perfil';
      setError(errorMessage);
      console.error('Error en fetchProfile:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar perfil al montar
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /**
   * Cambiar contraseña - API-076
   * POST /api/v1/profile/change-password
   */
  const changePassword = useCallback(async (currentPassword, newPassword, confirmPassword) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/profile/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });

      return {
        success: true,
        message: response.data.message || 'Contraseña actualizada correctamente'
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al cambiar contraseña';
      setError(errorMessage);
      console.error('Error en changePassword:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    changePassword
  };
};
