/**
 * Hook useDrivers - Gestión de choferes con API real
 * Reemplaza a useMockChoferes
 * Integrado con API-032, API-033, API-034, API-035
 */
import { useState, useEffect, useMemo } from 'react'
import DriversService from '@services/DriversService'
import useAuthStore from '@features/auth/useAuthStore'
import { ROLES } from '@utils/constants'
import { getLocalDateTime } from '@utils/dateUtils'

export const useDrivers = () => {
  const [drivers, setDrivers] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { user, isRole, getSedeIdParaFiltro, sedeIdActiva } = useAuthStore()
  const isSuperAdmin = isRole(ROLES.SUPERADMINISTRADOR)

  /**
   * Cargar choferes desde API
   * Para SUPERADMIN: filtra por sede seleccionada si hay una
   * Para otros roles: el backend filtra automáticamente por su sede
   */
  const loadDrivers = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = {
        pageSize: 100 // Cargar todos para simplificar
      }

      // Si hay sede activa seleccionada (SUPERADMIN), filtrar por ella
      if (sedeIdActiva) {
        params.branchId = sedeIdActiva
      }

      const response = await DriversService.listDrivers(params)

      setDrivers(response.data || [])
      setStats(response.stats || { total: 0, active: 0, inactive: 0 })
    } catch (err) {
      console.error('Error cargando choferes:', err)
      setError(err.message || 'Error al cargar choferes')
    } finally {
      setLoading(false)
    }
  }

  // Cargar choferes al montar y cuando cambie la sede activa
  useEffect(() => {
    loadDrivers()
  }, [sedeIdActiva])

  /**
   * Mapear driver (API inglés) -> chofer (frontend español) para compatibilidad
   */
  const choferes = useMemo(() => {
    return drivers.map(d => ({
      id: d.id,
      nombre: d.name,
      licencia: d.license,
      telefono: d.phone,
      activo: d.isActive,
      sedeId: d.branchId,
      sedeName: d.branchName,
      fechaContratacion: d.createdAt || getLocalDateTime(),
      fechaCreacion: d.createdAt,
      fechaActualizacion: d.updatedAt,
      notas: d.notes || '' // Campo opcional para notas
    }))
  }, [drivers])

  /**
   * Choferes activos (mapeados a español)
   */
  const choferesActivos = useMemo(() => {
    return choferes.filter(c => c.activo === true)
  }, [choferes])

  /**
   * Choferes inactivos (mapeados a español)
   */
  const choferesInactivos = useMemo(() => {
    return choferes.filter(c => c.activo === false)
  }, [choferes])

  /**
   * Obtener chofer por ID (devuelve datos mapeados a español)
   */
  const getChoferById = (id) => {
    return choferes.find(c => c.id === Number(id))
  }

  /**
   * Crear nuevo chofer
   * Mapeo: frontend (español) -> API (inglés)
   */
  const crearChofer = async (datosChofer) => {
    try {
      // Obtener branchId: sede del formulario > sede activa seleccionada > sede del usuario
      const branchId = datosChofer.sedeId || getSedeIdParaFiltro() || user?.sedeId

      if (!branchId) {
        return {
          success: false,
          error: 'Debe seleccionar una sede antes de crear un chofer'
        }
      }

      const payload = {
        name: datosChofer.nombre,
        license: datosChofer.licencia,
        phone: datosChofer.telefono,
        notes: datosChofer.notas || '',
        branchId: branchId
      }

      const response = await DriversService.createDriver(payload)

      if (response.success) {
        // Recargar lista
        await loadDrivers()
        return { success: true, id: response.id }
      }

      return { success: false, error: response.error || 'Error desconocido' }
    } catch (err) {
      console.error('Error creando chofer:', err)
      return { success: false, error: err.message || 'Error al crear chofer' }
    }
  }

  /**
   * Actualizar chofer
   * Mapeo: frontend (español) -> API (inglés)
   */
  const actualizarChofer = async (id, datosActualizados) => {
    try {
      const payload = {
        name: datosActualizados.nombre,
        license: datosActualizados.licencia,
        phone: datosActualizados.telefono,
        notes: datosActualizados.notas || '',
        branchId: datosActualizados.sedeId
      }

      const response = await DriversService.updateDriver(id, payload)

      if (response.success) {
        // Recargar lista
        await loadDrivers()
        return { success: true }
      }

      return { success: false, error: response.error || 'Error desconocido' }
    } catch (err) {
      console.error('Error actualizando chofer:', err)
      return { success: false, error: err.message || 'Error al actualizar chofer' }
    }
  }

  /**
   * Desactivar chofer (marca isActive = false)
   * ELM-053: Botón Desactivar
   */
  const desactivarChofer = async (id) => {
    try {
      const response = await DriversService.deactivateDriver(id)

      if (response.success) {
        // Recargar lista
        await loadDrivers()
        return { success: true }
      }

      return { success: false, error: response.error || 'Error desconocido' }
    } catch (err) {
      console.error('Error desactivando chofer:', err)
      return { success: false, error: err.message || 'Error al desactivar chofer' }
    }
  }

  /**
   * Reactivar chofer (marca isActive = true)
   * ELM-053: Botón Reactivar
   */
  const reactivarChofer = async (id) => {
    try {
      const response = await DriversService.reactivateDriver(id)

      if (response.success) {
        // Recargar lista
        await loadDrivers()
        return { success: true }
      }

      return { success: false, error: response.error || 'Error desconocido' }
    } catch (err) {
      console.error('Error reactivando chofer:', err)
      return { success: false, error: err.message || 'Error al reactivar chofer' }
    }
  }

  /**
   * Opciones para select (solo activos, usando campos en español)
   */
  const choferesOptions = useMemo(() => {
    return choferesActivos.map(c => ({
      value: c.id,
      label: `${c.nombre} - Lic: ${c.licencia}`
    }))
  }, [choferesActivos])

  /**
   * Obtener opciones de choferes filtrados por sede
   * @param {number} sedeId - ID de la sede para filtrar
   * @returns {Array} Opciones de choferes de esa sede
   */
  const getChoferesOptionsPorSede = (sedeId) => {
    if (!sedeId) return choferesOptions // Si no hay sede, devolver todos

    return choferesActivos
      .filter(c => c.sedeId === Number(sedeId))
      .map(c => ({
        value: c.id,
        label: `${c.nombre} - Lic: ${c.licencia}`
      }))
  }

  return {
    // Arrays
    choferes, // Compatibilidad con componente existente (mapeado a español)
    drivers, // API real (inglés)
    choferesActivos,
    choferesInactivos,
    choferesOptions,

    // Estados
    loading,
    error,
    stats,

    // Métodos
    getChoferById,
    getChoferesOptionsPorSede, // Filtrar choferes por sede
    crearChofer,
    actualizarChofer,
    desactivarChofer,
    reactivarChofer,
    loadDrivers, // Para recargar manualmente
  }
}

export default useDrivers
