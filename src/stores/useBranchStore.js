import { create } from 'zustand';
import * as branchService from '@services/branchService';

/**
 * Store para gestión de sedes/sucursales
 * Integrado con API-071 (listar sedes)
 */
const useBranchStore = create((set, get) => ({
  // Estado
  branches: [],
  isLoading: false,
  error: null,
  lastFetch: null,

  /**
   * Obtener sedes activas desde el backend
   * Usa API-071 con filtro isActive=true
   */
  fetchBranches: async (forceRefresh = false) => {
    const { lastFetch, branches } = get();

    // Cache simple: si ya se cargaron hace menos de 5 minutos, no recargar
    const CACHE_TIME = 5 * 60 * 1000; // 5 minutos
    if (!forceRefresh && lastFetch && (Date.now() - lastFetch < CACHE_TIME) && branches.length > 0) {
      return { success: true, data: branches };
    }

    set({ isLoading: true, error: null });

    try {
      const result = await branchService.getActiveBranches();

      if (result.success) {
        // Mapear campos del backend a frontend
        const mappedBranches = result.data.map(branch => ({
          id: branch.id,
          nombre: branch.name,
          codigo: branch.code || '',
          direccion: branch.address || '',
          telefono: branch.phone || '',
          email: branch.email || '',
          activo: branch.is_active !== false,
          esPrincipal: branch.is_main || false,
          color: branch.color || '#6366f1',
          // Campos adicionales del backend
          createdAt: branch.created_at,
          updatedAt: branch.updated_at
        }));

        set({
          branches: mappedBranches,
          isLoading: false,
          error: null,
          lastFetch: Date.now()
        });

        return { success: true, data: mappedBranches };
      } else {
        set({
          branches: [],
          isLoading: false,
          error: result.error
        });

        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMsg = error.message || 'Error al cargar sedes';
      set({
        branches: [],
        isLoading: false,
        error: errorMsg
      });

      return { success: false, error: errorMsg };
    }
  },

  /**
   * Obtener sede por ID
   * @param {string} id - ID de la sede
   * @returns {Object|null} - Sede encontrada o null
   */
  getById: (id) => {
    const { branches } = get();
    return branches.find(branch => branch.id === id) || null;
  },

  /**
   * Obtener sedes activas
   * @returns {Array} - Lista de sedes activas
   */
  getActiveBranches: () => {
    const { branches } = get();
    return branches.filter(branch => branch.activo);
  },

  /**
   * Obtener sede principal
   * @returns {Object|null} - Sede principal o null
   */
  getMainBranch: () => {
    const { branches } = get();
    return branches.find(branch => branch.esPrincipal) || branches[0] || null;
  },

  /**
   * Limpiar error
   */
  clearError: () => {
    set({ error: null });
  }
}));

export default useBranchStore;
