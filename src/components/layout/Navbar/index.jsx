import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@features/auth/useAuthStore'
import { ROLES } from '@utils/constants'
import WhatsAppButton from '@components/common/WhatsAppButton'
import SedeSelector from '@components/common/SedeSelector'

const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [whatsappMensaje, setWhatsappMensaje] = useState('Hola, necesito ayuda con el sistema de pedidos')

  useEffect(() => {
    const loadConfig = () => {
      const storedConfig = localStorage.getItem('whatsapp_config')
      if (storedConfig) {
        try {
          const parsedConfig = JSON.parse(storedConfig)
          setWhatsappMensaje(parsedConfig.whatsappMensajeHeader || 'Hola, necesito ayuda con el sistema de pedidos')
        } catch (error) {
          console.error('Error al cargar configuración de WhatsApp:', error)
        }
      }
    }

    loadConfig()

    const handleUpdate = (event) => {
      setWhatsappMensaje(event.detail.whatsappMensajeHeader || 'Hola, necesito ayuda con el sistema de pedidos')
    }

    window.addEventListener('whatsappConfigUpdate', handleUpdate)
    return () => window.removeEventListener('whatsappConfigUpdate', handleUpdate)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getRoleBadgeColor = (rol) => {
    switch (rol) {
      case ROLES.SUPERADMINISTRADOR:
        return 'bg-indigo-100 text-indigo-800'
      case ROLES.ADMINISTRADOR:
        return 'bg-purple-100 text-purple-800'
      case ROLES.COORDINADOR:
        return 'bg-blue-100 text-blue-800'
      case ROLES.PRODUCCION:
        return 'bg-green-100 text-green-800'
      case ROLES.CLIENTE:
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (rol) => {
    switch (rol) {
      case ROLES.SUPERADMINISTRADOR:
        return 'Super Admin'
      case ROLES.ADMINISTRADOR:
        return 'Administrador'
      case ROLES.COORDINADOR:
        return 'Coordinador'
      case ROLES.PRODUCCION:
        return 'Producción'
      case ROLES.CLIENTE:
        return 'Cliente'
      default:
        return rol
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="w-full px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-24 sm:h-28">
          {/* Botón hamburguesa y Logo */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Botón hamburguesa para móvil */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Abrir menú"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo y título */}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center flex-shrink-0 my-4">
                <img
                  src="/logoPapas.png"
                  alt="Murus Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="hidden sm:block min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">Murus</h1>
                <p className="text-xs text-gray-500 hidden md:block">Frescas y Listas para freír</p>
              </div>
            </button>
          </div>

          {/* Sede Selector, WhatsApp y Usuario */}
          <div className="flex items-center gap-3">
            {/* Selector de Sede para SUPERADMINISTRADOR */}
            <SedeSelector />

            {/* Botón WhatsApp solo para clientes */}
            {user && user.rol === ROLES.CLIENTE && (
              <WhatsAppButton mensaje={whatsappMensaje} variant="navbar" />
            )}

            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{user.nombre || 'Usuario'}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.rol)}`}
                    >
                      {getRoleLabel(user.rol)}
                    </span>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 font-semibold text-sm sm:text-base">
                      {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                </button>

                {/* Dropdown menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-lg py-1 z-60 border border-gray-200">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.nombre || 'Usuario'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email || 'Sin email'}</p>
                      <span
                        className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.rol)}`}
                      >
                        {getRoleLabel(user.rol)}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cerrar dropdown al hacer click fuera */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-55"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  )
}

export default Navbar
