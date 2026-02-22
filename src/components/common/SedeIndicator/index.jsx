import { useEffect } from 'react'
import useAuthStore from '@features/auth/useAuthStore'
import useBranchStore from '@stores/useBranchStore'
import { ROLES } from '@utils/constants'

/**
 * Indicador de Sede Activa
 * Muestra visualmente qué sede está siendo visualizada actualmente
 * Integrado con API-071 (listar sedes)
 *
 * Props:
 * - className: Clases adicionales para el contenedor
 * - showIcon: Mostrar icono de edificio (default: true)
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 */
const SedeIndicator = ({ className = '', showIcon = true, size = 'md' }) => {
  const { user, sedeIdActiva, canViewAllSedes } = useAuthStore()
  const { branches, fetchBranches, getById, getActiveBranches } = useBranchStore()

  // Cargar sedes al montar el componente
  useEffect(() => {
    if (user && user.rol !== ROLES.CLIENTE) {
      fetchBranches()
    }
  }, [user, fetchBranches])

  const sedesActivas = getActiveBranches()

  // Solo mostrar para usuarios internos (no clientes)
  if (!user || user.rol === ROLES.CLIENTE) {
    return null
  }

  // Determinar qué sede mostrar
  const verTodasLasSedes = canViewAllSedes()
  let sedeActual = null
  let mostrarTodas = false

  if (verTodasLasSedes) {
    // SUPERADMIN puede ver todas o una específica
    if (sedeIdActiva) {
      sedeActual = getById(sedeIdActiva)
    } else {
      mostrarTodas = true
    }
  } else {
    // Usuarios internos ven su sede asignada
    sedeActual = getById(user?.sedeId)
  }

  // Estilos según tamaño
  const sizeStyles = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      badge: 'w-4 h-4 text-[10px]'
    },
    md: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      badge: 'w-5 h-5 text-xs'
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      badge: 'w-6 h-6 text-sm'
    }
  }

  const styles = sizeStyles[size] || sizeStyles.md

  if (mostrarTodas) {
    return (
      <div
        className={`inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg ${styles.container} ${className}`}
      >
        {showIcon && (
          <svg
            className={`${styles.icon} text-indigo-600`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
        )}
        <span className="font-medium text-indigo-700">Todas las Sedes</span>
        <span
          className={`inline-flex items-center justify-center ${styles.badge} font-bold text-white bg-indigo-500 rounded-full`}
        >
          {sedesActivas.length}
        </span>
      </div>
    )
  }

  if (!sedeActual) {
    return null
  }

  return (
    <div
      className={`inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg ${styles.container} ${className}`}
    >
      {showIcon && (
        <div
          className={`${styles.badge} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
          style={{ backgroundColor: sedeActual.color || '#6366f1' }}
        >
          {sedeActual.codigo?.charAt(0) || sedeActual.nombre.charAt(0)}
        </div>
      )}
      <span className="font-medium text-gray-700">{sedeActual.nombre}</span>
      {sedeActual.esPrincipal && (
        <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
          Principal
        </span>
      )}
    </div>
  )
}

export default SedeIndicator
