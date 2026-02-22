/**
 * useBranches - Hook para gestionar Sedes (Branches)
 * Reemplaza useMockSedes con integración real a API-071
 * Segun diseño en 04_apis_lista.md linea 4522
 */
import { useState, useEffect, useMemo } from 'react';
import { BranchesService } from '@services/BranchesService';
import useAuthStore from '@features/auth/useAuthStore';
import { ROLES } from '@utils/constants';

/**
 * Hook para manejar Sedes (Sucursales) con API real
 *
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo maneja lógica de sedes
 * - Open/Closed: Extensible para agregar nuevas funcionalidades
 * - Dependency Inversion: Depende de BranchesService (abstracción)
 */
export const useBranches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuthStore();

  /**
   * Cargar sedes desde API
   * @param {boolean} includeInactive - Si true, incluye sedes inactivas (para gestión)
   */
  const loadBranches = async (includeInactive = true) => {
    setLoading(true);
    setError(null);

    try {
      const result = await BranchesService.listBranches({
        includeInactive, // Cargar todas las sedes (activas e inactivas) para gestión
        pageSize: 100
      });

      if (result.success) {
        // Mapear campos de API a formato esperado por el frontend
        const mappedBranches = result.data.map(branch => ({
          id: branch.id,
          nombre: branch.name,
          codigo: branch.code,
          direccion: branch.address,
          telefono: branch.phone,
          email: branch.email,
          responsable: branch.manager,
          activo: branch.isActive,
          esPrincipal: branch.isMain,
          color: branch.color,
          fechaCreacion: branch.createdAt
        }));

        setBranches(mappedBranches);
      } else {
        setError(result.error);
        setBranches([]);
      }
    } catch (err) {
      console.error('Error cargando sedes:', err);
      setError('Error al cargar sedes');
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar sedes al montar el componente
   */
  useEffect(() => {
    // Solo cargar si el usuario es SUPERADMINISTRADOR
    if (user && user.rol === ROLES.SUPERADMINISTRADOR) {
      loadBranches();
    }
  }, [user]);

  /**
   * Sedes activas disponibles
   */
  const sedesActivas = useMemo(() => {
    return branches.filter((sede) => sede.activo);
  }, [branches]);

  /**
   * Sede principal (para casos por defecto)
   */
  const sedePrincipal = useMemo(() => {
    return branches.find((sede) => sede.esPrincipal) || branches[0] || null;
  }, [branches]);

  /**
   * Sede actual del usuario logueado
   * - SUPERADMINISTRADOR: puede ver todas, pero tiene sede principal como default
   * - Otros roles internos: su sedeId asignado
   * - CLIENTE: null (no tiene sede asignada)
   */
  const sedeActual = useMemo(() => {
    if (!user) return null;

    if (user.rol === ROLES.CLIENTE) {
      return null; // Los clientes no tienen sede
    }

    if (user.rol === ROLES.SUPERADMINISTRADOR) {
      // SuperAdmin puede ver todo, pero su sede actual puede ser seleccionable
      return user.sedeId ? branches.find(s => s.id === user.sedeId) : sedePrincipal;
    }

    // Usuarios internos tienen una sede asignada
    return user.sedeId ? branches.find(s => s.id === user.sedeId) : sedePrincipal;
  }, [user, branches, sedePrincipal]);

  /**
   * Verifica si el usuario puede acceder a una sede específica
   * @param {number} sedeId - ID de la sede a verificar
   * @returns {boolean} True si tiene acceso
   */
  const tieneAccesoASede = (sedeId) => {
    if (!user) return false;

    // SuperAdmin tiene acceso a todas las sedes
    if (user.rol === ROLES.SUPERADMINISTRADOR) {
      return true;
    }

    // Los clientes pueden ver productos de cualquier sede activa
    if (user.rol === ROLES.CLIENTE) {
      return sedesActivas.some(s => s.id === sedeId);
    }

    // Usuarios internos solo acceden a su sede
    return user.sedeId === sedeId;
  };

  /**
   * Obtener sedes disponibles para el usuario actual
   * - SUPERADMINISTRADOR: todas las activas
   * - CLIENTE: todas las activas (para seleccionar dónde pedir)
   * - Otros: solo su sede
   */
  const sedesDisponibles = useMemo(() => {
    if (!user) return [];

    if (user.rol === ROLES.SUPERADMINISTRADOR || user.rol === ROLES.CLIENTE) {
      return sedesActivas;
    }

    // Usuarios internos solo ven su sede
    const miSede = branches.find(s => s.id === user.sedeId);
    return miSede ? [miSede] : [];
  }, [user, sedesActivas, branches]);

  /**
   * Crear nueva sede (solo SUPERADMINISTRADOR)
   */
  const createSede = async (nuevaSede) => {
    if (user?.rol !== ROLES.SUPERADMINISTRADOR) {
      return {
        success: false,
        error: 'Solo el Super Administrador puede crear sedes'
      };
    }

    setLoading(true);
    try {
      // Mapear campos de frontend a formato de API
      const branchData = {
        name: nuevaSede.nombre,
        code: nuevaSede.codigo,
        address: nuevaSede.direccion,
        phone: nuevaSede.telefono,
        email: nuevaSede.email,
        manager: nuevaSede.responsable,
        isMain: nuevaSede.esPrincipal || false,
        color: nuevaSede.color
      };

      const result = await BranchesService.createBranch(branchData);

      if (result.success) {
        // Recargar lista de sedes
        await loadBranches();
      }

      return result;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualizar sede (solo SUPERADMINISTRADOR)
   */
  const updateSede = async (sedeId, updates) => {
    if (user?.rol !== ROLES.SUPERADMINISTRADOR) {
      return {
        success: false,
        error: 'Solo el Super Administrador puede modificar sedes'
      };
    }

    setLoading(true);
    try {
      // Mapear campos de frontend a formato de API
      const branchData = {};
      if (updates.nombre !== undefined) branchData.name = updates.nombre;
      if (updates.direccion !== undefined) branchData.address = updates.direccion;
      if (updates.telefono !== undefined) branchData.phone = updates.telefono;
      if (updates.email !== undefined) branchData.email = updates.email;
      if (updates.responsable !== undefined) branchData.manager = updates.responsable;
      if (updates.esPrincipal !== undefined) branchData.isMain = updates.esPrincipal;
      if (updates.color !== undefined) branchData.color = updates.color;
      if (updates.activo !== undefined) branchData.isActive = updates.activo;

      const result = await BranchesService.updateBranch(sedeId, branchData);

      if (result.success) {
        // Recargar lista de sedes
        await loadBranches();
      }

      return result;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Desactivar sede (solo SUPERADMINISTRADOR)
   * No elimina, solo marca como inactiva
   */
  const desactivarSede = async (sedeId) => {
    if (user?.rol !== ROLES.SUPERADMINISTRADOR) {
      return {
        success: false,
        error: 'Solo el Super Administrador puede desactivar sedes'
      };
    }

    const sede = branches.find(s => s.id === sedeId);
    if (sede?.esPrincipal) {
      return {
        success: false,
        error: 'No se puede desactivar la sede principal'
      };
    }

    return await updateSede(sedeId, { activo: false });
  };

  /**
   * Eliminar sede permanentemente (solo SUPERADMINISTRADOR) - API-074
   * Valida que no tenga usuarios asignados antes de eliminar
   */
  const deleteSede = async (sedeId) => {
    if (user?.rol !== ROLES.SUPERADMINISTRADOR) {
      return {
        success: false,
        error: 'Solo el Super Administrador puede eliminar sedes'
      };
    }

    const sede = branches.find(s => s.id === sedeId);
    if (sede?.esPrincipal) {
      return {
        success: false,
        error: 'No se puede eliminar la sede principal'
      };
    }

    setLoading(true);
    try {
      const result = await BranchesService.deleteBranch(sedeId);

      if (result.success) {
        // Recargar lista de sedes
        await loadBranches();
      }

      return result;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtener sede por ID
   */
  const getById = (sedeId) => {
    return branches.find(s => s.id === sedeId) || null;
  };

  return {
    // Datos
    data: branches,
    sedes: branches,
    sedesActivas,
    sedePrincipal,
    sedeActual,
    sedesDisponibles,

    // Estados
    loading,
    error,

    // Métodos
    getById,
    tieneAccesoASede,
    createSede,
    updateSede,
    desactivarSede,
    deleteSede,
    refresh: loadBranches,
    activarSede: async (sedeId) => updateSede(sedeId, { activo: true })
  };
};
