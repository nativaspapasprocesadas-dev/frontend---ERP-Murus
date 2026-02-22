import { useState, useRef, useEffect } from 'react'
import useAuthStore from '@features/auth/useAuthStore'
import { useBranches } from '@hooks/useBranches'
import { ROLES } from '@utils/constants'

/**
 * Selector de Sede para SUPERADMINISTRADOR
 * Permite cambiar la sede activa para filtrar datos en todo el sistema
 * Integrado con API-071 (GET /api/v1/branches)
 */
const SedeSelector = () => {
  const { user, sedeIdActiva, setSedeActiva, isSuperAdmin } = useAuthStore()
  const { sedesActivas, loading, error } = useBranches()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Solo mostrar para SUPERADMINISTRADOR
  if (!user || user.rol !== ROLES.SUPERADMINISTRADOR) {
    return null
  }

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Obtener la sede actual seleccionada
  const sedeSeleccionada = sedeIdActiva
    ? sedesActivas.find(s => s.id === sedeIdActiva)
    : null

  const handleSedeChange = (sedeId) => {
    setSedeActiva(sedeId)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
        title="Cambiar sede activa"
        disabled={loading}
      >
        {/* Icono de edificio/sede */}
        <svg
          className="w-5 h-5 text-indigo-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>

        <span className="text-sm font-medium text-indigo-700 hidden sm:inline max-w-[120px] truncate">
          {loading ? 'Cargando...' : (sedeSeleccionada ? sedeSeleccionada.nombre : 'Todas las Sedes')}
        </span>

        {/* Indicador de "todas" */}
        {!sedeSeleccionada && (
          <span className="hidden sm:inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-500 rounded-full">
            {sedesActivas.length}
          </span>
        )}

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-indigo-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[80]">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Seleccionar Sede
            </p>
          </div>

          {/* Opción: Todas las Sedes */}
          <button
            onClick={() => handleSedeChange(null)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
              sedeIdActiva === null ? 'bg-indigo-50' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              sedeIdActiva === null ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${sedeIdActiva === null ? 'text-indigo-700' : 'text-gray-900'}`}>
                Todas las Sedes
              </p>
              <p className="text-xs text-gray-500">
                Ver datos consolidados
              </p>
            </div>
            {sedeIdActiva === null && (
              <svg className="w-5 h-5 text-indigo-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Divider */}
          <div className="border-t border-gray-100 my-1"></div>

          {/* Error al cargar sedes */}
          {error && (
            <div className="px-3 py-2 text-xs text-red-600 bg-red-50 border-l-2 border-red-500">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="px-3 py-2 text-xs text-gray-500 text-center">
              Cargando sedes...
            </div>
          )}

          {/* Lista de sedes */}
          {!loading && !error && sedesActivas.map((sede) => (
            <button
              key={sede.id}
              onClick={() => handleSedeChange(sede.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                sedeIdActiva === sede.id ? 'bg-indigo-50' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm`}
                style={{ backgroundColor: sede.color || '#6366f1' }}
              >
                {sede.codigo?.charAt(0) || sede.nombre.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${sedeIdActiva === sede.id ? 'text-indigo-700' : 'text-gray-900'}`}>
                  {sede.nombre}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {sede.direccion || sede.codigo}
                </p>
              </div>
              {sede.esPrincipal && (
                <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium flex-shrink-0">
                  Principal
                </span>
              )}
              {sedeIdActiva === sede.id && (
                <svg className="w-5 h-5 text-indigo-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default SedeSelector
