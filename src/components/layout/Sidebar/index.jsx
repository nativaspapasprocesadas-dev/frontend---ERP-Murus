import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import useAuthStore from '@features/auth/useAuthStore'
import { ROLES } from '@utils/constants'

const Sidebar = ({ isOpen, onClose }) => {
  const { user, hasPermission } = useAuthStore()
  const [expandedMenus, setExpandedMenus] = useState({})

  const menuItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: '📊',
      roles: [ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.PRODUCCION, ROLES.CLIENTE]
    },
    {
      label: 'Catálogo',
      path: '/catalogo',
      icon: '🛍️',
      roles: [ROLES.CLIENTE]
    },
    {
      label: 'Productos',
      icon: '🥔',
      roles: [ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR],
      submenu: [
        { label: 'Especies', path: '/especies' },
        { label: 'Medidas', path: '/medidas' },
        { label: 'Presentaciones', path: '/presentaciones' },
        { label: 'Productos', path: '/productos' }
      ]
    },
    {
      label: 'Clientes',
      path: '/clientes',
      icon: '👥',
      roles: [ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR]
    },
    {
      label: 'Pedidos',
      path: '/pedidos',
      icon: '📦',
      roles: [ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.CLIENTE]
    },
    {
      label: 'Rutas',
      path: '/rutas',
      icon: '🚚',
      roles: [ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR]
    },
    {
      label: 'Choferes',
      path: '/choferes',
      icon: '👨‍✈️',
      roles: [ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR]
    },
    {
      label: 'Producción',
      path: '/produccion/pizarra',
      icon: '🏭',
      roles: [ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.PRODUCCION]
    },
    {
      label: 'Créditos',
      path: '/creditos',
      icon: '💳',
      roles: [ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.CLIENTE]
    },
    {
      label: 'Pagos',
      path: '/pagos',
      icon: '💰',
      roles: [ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR]
    },
    {
      label: 'Comunicados',
      path: '/comunicados',
      icon: '📢',
      roles: [ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.CLIENTE]
    },
    {
      label: 'Reportes',
      icon: '📈',
      roles: [ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR],
      submenu: [
        { label: 'General', path: '/reportes' },
        { label: 'Ventas Diarias', path: '/reportes/ventas-diarias' },
        { label: 'Rutas (Despacho)', path: '/reportes/rutas' },
        { label: 'Kilos por Especie', path: '/reportes/kilos-especie' },
        { label: 'Por Clientes', path: '/reportes/clientes' }
      ]
    },
    {
      label: 'Sedes',
      path: '/sedes',
      icon: '🏢',
      roles: [ROLES.SUPERADMINISTRADOR]
    },
    {
      label: 'Usuarios',
      path: '/usuarios',
      icon: '👥',
      roles: [ROLES.SUPERADMINISTRADOR]
    },
    {
      label: 'Configuración',
      path: '/configuracion',
      icon: '⚙️',
      roles: [ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR]
    },
    {
      label: 'Mi Perfil',
      path: '/perfil',
      icon: '👤',
      roles: [ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.PRODUCCION, ROLES.CLIENTE]
    }
  ]

  const canAccessMenuItem = (item) => {
    if (!item.roles) return true
    return item.roles.includes(user?.rol)
  }

  const toggleSubmenu = (index) => {
    setExpandedMenus(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const handleLinkClick = () => {
    if (onClose) onClose()
  }

  return (
    <>
      {/* Overlay para móvil - Backdrop oscuro semitransparente */}
      <div
        className={`
          fixed inset-0 top-24 sm:top-28 bg-black z-30 lg:hidden
          transition-opacity duration-300 ease-in-out
          ${isOpen ? 'opacity-60' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static left-0 z-40
          top-24 sm:top-28 lg:top-0
          bottom-0 lg:bottom-auto
          w-64 bg-gray-800 text-white
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col lg:h-full
        `}
      >

        {/* Navegación */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto overflow-x-hidden min-h-0">
          {menuItems.map((item, index) => {
            if (!canAccessMenuItem(item)) return null

            if (item.submenu) {
              const isExpanded = expandedMenus[index]
              return (
                <div key={index} className="space-y-1">
                  <button
                    onClick={() => toggleSubmenu(index)}
                    className="w-full flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-300 text-sm font-medium hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base sm:text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isExpanded && (
                    <div className="pl-4 sm:pl-6 space-y-1">
                      {item.submenu.map((subItem, subIndex) => (
                        <NavLink
                          key={subIndex}
                          to={subItem.path}
                          onClick={handleLinkClick}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm border-l-4 ${
                              isActive
                                ? 'bg-primary-500 text-white border-primary-400 font-semibold'
                                : 'text-gray-400 hover:bg-gray-700 hover:text-white border-transparent'
                            }`
                          }
                        >
                          <span>{subItem.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <NavLink
                key={index}
                to={item.path}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors border-l-4 ${
                    isActive
                      ? 'bg-primary-500 text-white border-primary-400 font-semibold shadow-lg shadow-primary-500/30'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white border-transparent'
                  }`
                }
              >
                <span className="text-lg sm:text-xl">{item.icon}</span>
                <span className="font-medium text-sm sm:text-base">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
