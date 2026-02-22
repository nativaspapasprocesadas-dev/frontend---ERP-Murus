import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  listSpecies,
  createSpecies,
  updateSpecies,
  deleteSpecies
} from '@services/SpeciesService'
import useAuthStore from '@features/auth/useAuthStore'
import { ROLES } from '@utils/constants'

/**
 * Hook para gestionar especies con integración real a API-045, API-046, API-047, API-048
 * Reemplaza useMock(mockEspecies) con llamadas reales al backend
 *
 * INTEGRACIÓN:
 * - ELM-087 (Vista Gestion de Especies)
 * - ELM-088 (Tabla Lista de Especies)
 * - ELM-089 (Modal Nueva/Editar Especie)
 * - ELM-091 (Modal Confirmar Eliminacion)
 */
export const useSpecies = () => {
  const [especies, setEspecies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useAuthStore()

  // Verificar si el usuario puede gestionar especies
  const puedeGestionar = useMemo(() => {
    return user && (
      user.rol === ROLES.ADMINISTRADOR ||
      user.rol === ROLES.SUPERADMINISTRADOR
    )
  }, [user])

  // Cargar especies desde API-045
  const cargarEspecies = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await listSpecies({ page: 1, pageSize: 100 })

      if (response.success && response.data) {
        // Mapear campos del backend (inglés) al formato del frontend (español)
        const especiesMapeadas = response.data.map(item => ({
          id: item.id,
          nombre: item.name,
          descripcion: item.description || '',
          activa: item.isActive,
          orden: item.order || 0,
          fechaCreacion: item.createdAt,
          fechaActualizacion: item.updatedAt
        }))

        setEspecies(especiesMapeadas)
      } else {
        setEspecies([])
      }
    } catch (err) {
      console.error('Error cargando especies:', err)
      setError(err.message || 'Error al cargar especies')
      setEspecies([])
    } finally {
      setLoading(false)
    }
  }, [user])

  // Cargar especies al montar el componente
  useEffect(() => {
    cargarEspecies()
  }, [cargarEspecies])

  // Crear especie - API-046
  const crearEspecie = async (datosEspecie) => {
    if (!puedeGestionar) {
      return { success: false, error: 'No tienes permisos para crear especies' }
    }

    setLoading(true)
    try {
      // Mapear campos frontend (español) a backend (inglés)
      const payload = {
        name: datosEspecie.nombre,
        description: datosEspecie.descripcion || null,
        isActive: datosEspecie.activa !== undefined ? datosEspecie.activa : true
      }

      const response = await createSpecies(payload)

      if (response.success) {
        // Recargar lista para obtener datos actualizados
        await cargarEspecies()
        return { success: true }
      }

      return { success: false, error: 'Error al crear especie' }
    } catch (err) {
      console.error('Error creando especie:', err)
      return { success: false, error: err.message || 'Error al crear especie' }
    } finally {
      setLoading(false)
    }
  }

  // Actualizar especie - API-047
  const actualizarEspecie = async (id, datosActualizados) => {
    if (!puedeGestionar) {
      return { success: false, error: 'No tienes permisos para editar especies' }
    }

    setLoading(true)
    try {
      // Mapear campos frontend (español) a backend (inglés)
      const payload = {
        name: datosActualizados.nombre,
        description: datosActualizados.descripcion || null,
        isActive: datosActualizados.activa !== undefined ? datosActualizados.activa : true
      }

      const response = await updateSpecies(id, payload)

      if (response.success) {
        // Recargar lista
        await cargarEspecies()
        return { success: true }
      }

      return { success: false, error: 'Error al actualizar especie' }
    } catch (err) {
      console.error('Error actualizando especie:', err)
      return { success: false, error: err.message || 'Error al actualizar especie' }
    } finally {
      setLoading(false)
    }
  }

  // Eliminar especie - API-048
  const eliminarEspecie = async (id) => {
    if (!puedeGestionar) {
      return { success: false, error: 'No tienes permisos para eliminar especies' }
    }

    setLoading(true)
    try {
      const response = await deleteSpecies(id)

      if (response.success) {
        // Recargar lista
        await cargarEspecies()
        return { success: true }
      }

      // Devolver el error del servidor si existe
      return { success: false, error: response.error || 'Error al eliminar especie' }
    } catch (err) {
      console.error('Error eliminando especie:', err)
      // Devolver el mensaje completo del backend
      return { success: false, error: err.message || 'Error al eliminar especie' }
    } finally {
      setLoading(false)
    }
  }

  // Obtener especie por ID
  const getEspecieById = (id) => {
    return especies.find(e => e.id === id)
  }

  // Filtrar especies activas
  const especiesActivas = useMemo(() => {
    return especies.filter(e => e.activa)
  }, [especies])

  // Alternar estado activo/inactivo de una especie
  const toggleEstado = async (id, estadoActual) => {
    if (!puedeGestionar) {
      return { success: false, error: 'No tienes permisos para cambiar el estado' }
    }

    setLoading(true)
    try {
      const payload = { isActive: !estadoActual }
      const response = await updateSpecies(id, payload)

      if (response.success) {
        await cargarEspecies()
        return { success: true }
      }

      return { success: false, error: 'Error al cambiar estado de la especie' }
    } catch (err) {
      console.error('Error cambiando estado de especie:', err)
      return { success: false, error: err.message || 'Error al cambiar estado' }
    } finally {
      setLoading(false)
    }
  }

  return {
    especies,
    especiesActivas,
    loading,
    error,
    puedeGestionar,
    crearEspecie,
    actualizarEspecie,
    eliminarEspecie,
    toggleEstado,
    getEspecieById,
    recargar: cargarEspecies
  }
}

export default useSpecies
