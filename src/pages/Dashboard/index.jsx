import { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import useAuthStore from '@features/auth/useAuthStore'
import { useRoutes } from '@hooks/useRoutes'
import { usePizarraData } from '@hooks/usePizarraData'
import useBranchStore from '@stores/useBranchStore'
import { useClienteActual, useHorarioRuta, usePedidosCliente } from '@hooks'
import { useDashboardStats } from '@hooks/useDashboardStats'
import { useUnreadAnnouncements } from '@hooks/useUnreadAnnouncements'
import { useCreditConfiguration } from '@hooks/useConfiguration'
import { CreditService } from '@services/CreditService'
import { Card, Badge, Button, BannerRecordatorio, Modal } from '@components/common'
import { formatearMoneda, formatearKilos, formatearFecha } from '@utils/formatters'
import { ROLES, ESTADOS_PEDIDO } from '@utils/constants'

/**
 * Vista de Dashboard
 *
 * Responsabilidad única: Mostrar estadísticas y accesos rápidos según el rol del usuario
 *
 * INTEGRACIÓN:
 * - ELM-080 (Dashboard): INTEGRADO con API-004 GET /api/v1/dashboard/stats
 * - ELM-081 (StatsCard): INTEGRADO con API-004
 * - ELM-083 (Modal Comunicados Pendientes): INTEGRADO con API-005 GET /api/v1/announcements/unread y API-031 POST /api/v1/announcements/:id/read
 * - Alertas de clientes con deuda vencida: INTEGRADO con API-022
 * - Indicador de sedes: INTEGRADO con API-071 GET /api/v1/branches (useBranchStore)
 * - Rutas: INTEGRADO con API-036 GET /api/v1/routes
 * - Pedidos: INTEGRADO con dashboardStats de API-004
 * - Eliminado TODOS los mocks
 */
const Dashboard = () => {
  const navigate = useNavigate()
  const { user, isRole, sedeIdActiva, canViewAllSedes, isSuperAdmin } = useAuthStore()

  // Hook de estadisticas reales del dashboard (API-004)
  const { stats: dashboardStats, loading: loadingStats, error: errorStats } = useDashboardStats({
    branchId: canViewAllSedes() ? null : sedeIdActiva,
    enabled: true
  })

  // Hook de comunicados no leídos - ELM-083 (API-005, API-031)
  const {
    comunicadosNoLeidos,
    loading: loadingComunicados,
    tieneComunicadosNoLeidos,
    marcarComoLeido
  } = useUnreadAnnouncements()

  // Estados para modal de comunicados - ELM-083
  const [mostrarModalComunicado, setMostrarModalComunicado] = useState(false)
  const [comunicadoActual, setComunicadoActual] = useState(null)
  const [indiceComunicadoActual, setIndiceComunicadoActual] = useState(0)
  const [imagenExpandida, setImagenExpandida] = useState(null)

  // Estado para clientes con deuda vencida (API-022)
  const [clientesConDeudaVencida, setClientesConDeudaVencida] = useState([])
  const [cargandoDeudores, setCargandoDeudores] = useState(false)

  // Hook de configuración de crédito para alertas
  const { config: creditConfig, loading: loadingCreditConfig } = useCreditConfiguration()

  // Ref para controlar que el toast solo se muestre una vez por sesión
  const alertaToastMostrado = useRef(false)

  // Hook de pedidos del cliente (API real)
  const { pedidos: pedidosCliente, pedidosPendientes: pedidosPendientesCliente, pedidosHoy: pedidosHoyCliente } = usePedidosCliente()

  // Hook de rutas (API-036) - para Admin/Coordinador
  const { rutasHoy, rutasAbiertas } = useRoutes()

  // Hook de pizarra para roles con acceso a produccion (API-044)
  // Solo SUPERADMINISTRADOR, ADMINISTRADOR, COORDINADOR y PRODUCCION tienen acceso
  // Los CLIENTES NO deben llamar este endpoint
  const tieneAccesoPizarra = isRole(ROLES.SUPERADMINISTRADOR) || isRole(ROLES.ADMINISTRADOR) ||
    isRole(ROLES.COORDINADOR) || isRole(ROLES.PRODUCCION)

  const { rutasAbiertasHoy, loading: loadingPizarra } = usePizarraData({
    branchId: canViewAllSedes() ? null : sedeIdActiva,
    enabled: tieneAccesoPizarra
  })

  // Usar rutasAbiertasHoy de usePizarraData para PRODUCCION, rutasAbiertas de useRoutes para otros roles
  const rutasAbiertasParaStats = isRole(ROLES.PRODUCCION) ? rutasAbiertasHoy : rutasAbiertas

  // Pedidos pendientes desde dashboardStats (API-004)
  const pedidosPendientes = dashboardStats?.pendingOrders || []

  // Store real de sedes (integrado con API-071)
  const { branches, fetchBranches, getActiveBranches } = useBranchStore()
  const sedesActivas = getActiveBranches()

  // Cargar sedes al montar el componente
  useEffect(() => {
    if (isSuperAdmin()) {
      fetchBranches()
    }
  }, [isSuperAdmin, fetchBranches])
  const clienteActual = useClienteActual()
  const { estadoHorario } = useHorarioRuta(clienteActual?.ruta)

  // Obtener la sede activa actual para mostrar en el indicador
  const sedeActiva = useMemo(() => {
    if (!isSuperAdmin()) return null
    if (canViewAllSedes()) return null // Viendo todas
    return sedesActivas.find(s => s.id === sedeIdActiva)
  }, [isSuperAdmin, canViewAllSedes, sedesActivas, sedeIdActiva])

  // INTEGRADO: Cargar clientes con deuda vencida usando API-022
  useEffect(() => {
    const cargarClientesConDeudaVencida = async () => {
      if (!isRole(ROLES.ADMINISTRADOR) && !isRole(ROLES.COORDINADOR) && !isRole(ROLES.SUPERADMINISTRADOR)) {
        return
      }

      try {
        setCargandoDeudores(true)
        const branchId = canViewAllSedes() ? null : sedeIdActiva
        const result = await CreditService.getDebtors({ branchId, hasOverdue: true })

        // Mapear respuesta de API al formato esperado por la UI
        const clientesMapeados = (result.data || []).map(cliente => ({
          clienteId: cliente.customerId,
          nombreCliente: cliente.customerName,
          saldoActual: cliente.totalDebt,
          cantidadMovimientos: cliente.overdueCharges
        }))

        setClientesConDeudaVencida(clientesMapeados)
      } catch (error) {
        console.error('Error cargando clientes con deuda vencida:', error)
        // No mostrar toast para no interrumpir UX del dashboard
      } finally {
        setCargandoDeudores(false)
      }
    }

    cargarClientesConDeudaVencida()
  }, [isRole, sedeIdActiva, canViewAllSedes])

  // INTEGRADO ELM-083: Mostrar modal automáticamente cuando hay comunicados no leídos
  useEffect(() => {
    if (!loadingComunicados && tieneComunicadosNoLeidos && comunicadosNoLeidos.length > 0) {
      setIndiceComunicadoActual(0)
      setComunicadoActual(comunicadosNoLeidos[0])
      setMostrarModalComunicado(true)
    }
  }, [loadingComunicados, tieneComunicadosNoLeidos, comunicadosNoLeidos])

  // Mostrar toast de alerta de crédito cuando hay clientes que exceden el monto configurado
  useEffect(() => {
    // Solo para roles administrativos
    const esRolAdmin = isRole(ROLES.SUPERADMINISTRADOR) || isRole(ROLES.ADMINISTRADOR) || isRole(ROLES.COORDINADOR)

    // Esperar a que tanto las estadísticas como la configuración de crédito hayan cargado
    if (!esRolAdmin || loadingStats || loadingCreditConfig || alertaToastMostrado.current) {
      return
    }

    const montoAlerta = creditConfig?.montoAltoGlobal || 0
    const cantidadAlertas = dashboardStats?.alertasCredito || 0

    // Mostrar toast si hay alertas de crédito y el monto configurado es mayor a 0
    if (cantidadAlertas > 0 && montoAlerta > 0) {
      alertaToastMostrado.current = true
      toast.warning(
        `Alerta de Crédito: ${cantidadAlertas} cliente(s) con deuda que excede el monto configurado (${formatearMoneda(montoAlerta)})`,
        {
          position: 'top-right',
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          onClick: () => navigate('/creditos')
        }
      )
    }
  }, [loadingStats, loadingCreditConfig, dashboardStats?.alertasCredito, creditConfig?.montoAltoGlobal, isRole, navigate])

  // Handlers para el modal de comunicados - ELM-083
  const handleCerrarComunicado = async () => {
    if (comunicadoActual) {
      // Marcar como leído usando API-031
      await marcarComoLeido(comunicadoActual.id)
    }

    // Mostrar siguiente comunicado si hay más
    if (indiceComunicadoActual + 1 < comunicadosNoLeidos.length) {
      const siguienteIndice = indiceComunicadoActual + 1
      setIndiceComunicadoActual(siguienteIndice)
      setComunicadoActual(comunicadosNoLeidos[siguienteIndice])
    } else {
      // No hay más comunicados, cerrar modal
      setMostrarModalComunicado(false)
      setComunicadoActual(null)
      setIndiceComunicadoActual(0)
    }
  }

  // Estadísticas generales (AlertCard - ELM-082)
  // INTEGRADO: Usa datos reales de API-004 en lugar de mocks
  const stats = useMemo(() => {
    if (loadingStats) {
      return [] // Mientras carga, no mostrar stats
    }

    if (isRole(ROLES.CLIENTE)) {
      // Stats para clientes - INTEGRADO con API-006 (pedidos del cliente)
      const miCredito = clienteActual?.totalDeuda || 0

      return [
        {
          label: 'Mis Pedidos',
          value: pedidosCliente.length,
          icon: '📦',
          color: 'blue',
          action: () => navigate('/pedidos')
        },
        {
          label: 'Pendientes',
          value: pedidosPendientesCliente.length,
          icon: '⏳',
          color: pedidosPendientesCliente.length > 0 ? 'yellow' : 'green'
        },
        {
          label: 'Mi Crédito',
          value: formatearMoneda(miCredito),
          icon: '💳',
          color: miCredito > 0 ? 'red' : 'green',
          action: () => navigate('/creditos')
        }
      ]
    }

    if (isRole(ROLES.PRODUCCION)) {
      // Stats para producción - INTEGRADO con API-004 y API-044
      return [
        {
          label: 'Pedidos Hoy',
          value: dashboardStats.totalPedidosHoy,
          icon: '📦',
          color: 'blue'
        },
        {
          label: 'Rutas Abiertas',
          value: rutasAbiertasParaStats.length, // Usa usePizarraData para PRODUCCION
          icon: '🚚',
          color: 'green',
          action: () => navigate('/produccion/pizarra')
        },
        {
          label: 'Total Ventas Hoy',
          value: formatearMoneda(dashboardStats.totalVentasHoy),
          icon: '⚖️',
          color: 'purple'
        }
      ]
    }

    // Stats para SuperAdmin, Admin y Coordinador - INTEGRADO con API-004
    return [
      {
        label: 'Pedidos Pendientes',
        value: dashboardStats.pedidosPendientes,
        icon: '📦',
        color: 'blue',
        action: () => navigate('/pedidos')
      },
      {
        label: 'Pedidos Hoy',
        value: dashboardStats.totalPedidosHoy,
        icon: '📅',
        color: 'green',
        action: () => navigate('/pedidos')
      },
      {
        label: 'Clientes con Deuda',
        value: dashboardStats.clientesConDeuda,
        icon: '⚠️',
        color: 'red',
        action: () => navigate('/creditos')
      },
      {
        label: 'Alertas de Crédito',
        value: dashboardStats.alertasCredito,
        icon: '💰',
        color: dashboardStats.alertasCredito > 0 ? 'red' : 'green',
        action: () => navigate('/creditos')
      }
    ]
  }, [
    user,
    isRole,
    loadingStats,
    dashboardStats,
    pedidosCliente,
    pedidosPendientesCliente,
    rutasAbiertasParaStats,
    clienteActual,
    navigate
  ])

  const getStatColor = (color) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      purple: 'bg-purple-500',
      red: 'bg-red-500'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            ¡Bienvenido, {user?.nombre?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString('es-PE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Indicador de Sede para SUPERADMINISTRADOR */}
        {isSuperAdmin() && (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div>
              <p className="text-xs text-indigo-600 font-medium">Datos de:</p>
              <p className="text-sm font-bold text-indigo-800">
                {canViewAllSedes() ? (
                  <span className="flex items-center gap-1">
                    Todas las Sedes
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-indigo-500 text-white rounded-full">
                      {sedesActivas.length}
                    </span>
                  </span>
                ) : (
                  sedeActiva?.nombre || 'Sede desconocida'
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Banner de recordatorio de horario (solo para clientes) */}
      {isRole(ROLES.CLIENTE) && clienteActual && estadoHorario.mostrarBanner && (
        <BannerRecordatorio
          titulo={
            estadoHorario.estado === 'proximo-a-cerrar'
              ? 'Próximo a cerrar'
              : estadoHorario.estado === 'fuera-de-horario'
              ? 'Horario cerrado'
              : 'Recordatorio'
          }
          mensaje={estadoHorario.mensaje}
          variant={estadoHorario.tipo}
        />
      )}

      {/* Estadísticas - ELM-082 AlertCard */}
      {/* INTEGRADO: Consume API-004 /api/v1/dashboard/stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingStats ? (
          // Skeleton loading
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </Card>
          ))
        ) : errorStats ? (
          <div className="col-span-full">
            <Card className="border-l-4 border-red-500 bg-red-50">
              <p className="text-red-700">Error al cargar estadísticas: {errorStats}</p>
            </Card>
          </div>
        ) : (
          stats.map((stat, index) => (
            <Card
              key={index}
              className={`cursor-pointer hover:shadow-lg transition-shadow ${
                stat.action ? 'hover:scale-105 transform transition-transform' : ''
              }`}
              onClick={stat.action}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div
                  className={`w-12 h-12 ${getStatColor(stat.color)} rounded-lg flex items-center justify-center text-2xl`}
                >
                  {stat.icon}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Alertas y acciones rápidas (SuperAdmin, Admin, Coordinador) */}
      {(isRole(ROLES.SUPERADMINISTRADOR) || isRole(ROLES.ADMINISTRADOR) || isRole(ROLES.COORDINADOR)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alertas de clientes con deuda vencida */}
          {clientesConDeudaVencida.length > 0 && (
            <Card title="Clientes con Deuda Vencida" className="border-l-4 border-red-500">
              <div className="space-y-3">
                {clientesConDeudaVencida.slice(0, 5).map((estadoCuenta) => (
                  <div
                    key={estadoCuenta.clienteId}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{estadoCuenta.nombreCliente}</p>
                      <p className="text-sm text-red-600">
                        Saldo: {formatearMoneda(estadoCuenta.saldoActual)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {estadoCuenta.cantidadMovimientos} movimiento(s)
                      </p>
                    </div>
                    <Badge variant="danger">Vencido</Badge>
                  </div>
                ))}
                {clientesConDeudaVencida.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    Y {clientesConDeudaVencida.length - 5} cliente(s) más...
                  </p>
                )}
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => navigate('/creditos')}
                >
                  Ver Gestión de Créditos
                </Button>
              </div>
            </Card>
          )}

          {/* Pedidos pendientes */}
          {pedidosPendientes.length > 0 && (
            <Card title="Pedidos Pendientes de Asignar">
              <div className="space-y-3">
                {pedidosPendientes.slice(0, 5).map((pedido) => (
                  <div
                    key={pedido.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{pedido.nombreCliente}</p>
                      <p className="text-sm text-gray-600">
                        {formatearKilos(pedido.totalKilos)} - {formatearMoneda(pedido.totalMonto)}
                      </p>
                    </div>
                    <Badge variant="warning">Pendiente</Badge>
                  </div>
                ))}
                {pedidosPendientes.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    Y {pedidosPendientes.length - 5} pedido(s) más...
                  </p>
                )}
                <Button className="w-full" onClick={() => navigate('/pedidos')}>
                  Asignar Pedidos a Rutas
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Acciones rápidas para producción */}
      {isRole(ROLES.PRODUCCION) && (
        <Card title="Acciones Rápidas">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              size="lg"
              className="h-20"
              onClick={() => navigate('/produccion/pizarra')}
            >
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">🏭</span>
                <span>Ver Pizarra de Producción</span>
              </div>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-20"
              onClick={() => navigate('/pedidos')}
            >
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">📦</span>
                <span>Ver Pedidos del Día</span>
              </div>
            </Button>
          </div>
        </Card>
      )}

      {/* Acciones rápidas para clientes */}
      {isRole(ROLES.CLIENTE) && (
        <Card title="Acciones Rápidas">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              size="lg"
              className="h-20"
              onClick={() => navigate('/pedidos/nuevo')}
            >
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">➕</span>
                <span>Nuevo Pedido</span>
              </div>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-20"
              onClick={() => navigate('/pedidos')}
            >
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">📦</span>
                <span>Mis Pedidos</span>
              </div>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-20"
              onClick={() => navigate('/creditos')}
            >
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">💳</span>
                <span>Mi Estado de Cuenta</span>
              </div>
            </Button>
          </div>
        </Card>
      )}

      {/* Modal de Comunicados Pendientes - ELM-083 */}
      {/* INTEGRADO: Usa API-005 para obtener comunicados no leídos y API-031 para marcar como leído */}
      {mostrarModalComunicado && comunicadoActual && (
        <Modal
          isOpen={mostrarModalComunicado}
          onClose={handleCerrarComunicado}
          title="📢 Comunicado Importante"
          size="md"
        >
          <div className="space-y-4">
            {/* Titulo del comunicado */}
            <h3 className="text-xl font-bold text-gray-900">
              {comunicadoActual.titulo}
            </h3>

            {/* Mensaje del comunicado */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-gray-800 whitespace-pre-wrap">
                {comunicadoActual.mensaje}
              </p>
            </div>

            {/* Imagen del comunicado (si existe) - clickeable para expandir */}
            {comunicadoActual.imagen && (
              <div className="mt-4">
                <img
                  src={
                    comunicadoActual.imagen.startsWith('http')
                      ? comunicadoActual.imagen
                      : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4020'}${comunicadoActual.imagen}`
                  }
                  alt="Imagen del comunicado"
                  className="w-full max-h-64 object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setImagenExpandida(
                    comunicadoActual.imagen.startsWith('http')
                      ? comunicadoActual.imagen
                      : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4020'}${comunicadoActual.imagen}`
                  )}
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                  title="Click para ampliar"
                />
                <p className="text-xs text-gray-400 text-center mt-1">Click en la imagen para ampliar</p>
              </div>
            )}

            {/* Fecha del comunicado */}
            {comunicadoActual.fechaCreacion && (
              <p className="text-sm text-gray-500">
                Fecha: {formatearFecha(comunicadoActual.fechaCreacion)}
              </p>
            )}

            {/* Prioridad del comunicado */}
            {comunicadoActual.prioridad && (
              <div className="flex items-center gap-2">
                <Badge
                  variant={comunicadoActual.prioridad === 'ALTA' ? 'danger' : comunicadoActual.prioridad === 'MEDIA' ? 'warning' : 'info'}
                >
                  {comunicadoActual.prioridad === 'ALTA' ? 'Alta Prioridad' :
                   comunicadoActual.prioridad === 'MEDIA' ? 'Prioridad Media' :
                   'Información'}
                </Badge>
              </div>
            )}

            {/* Indicador de comunicados pendientes */}
            {comunicadosNoLeidos.length > 1 && (
              <p className="text-sm text-gray-600">
                Comunicado {indiceComunicadoActual + 1} de {comunicadosNoLeidos.length}
              </p>
            )}

            {/* Botón para cerrar / siguiente */}
            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="primary"
                onClick={handleCerrarComunicado}
              >
                {indiceComunicadoActual + 1 < comunicadosNoLeidos.length
                  ? 'Siguiente'
                  : 'Entendido'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Lightbox para imagen expandida */}
      {imagenExpandida && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-[10000] flex items-center justify-center p-4"
          onClick={() => setImagenExpandida(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            {/* Botón cerrar */}
            <button
              onClick={() => setImagenExpandida(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl font-bold"
            >
              ✕ Cerrar
            </button>
            {/* Imagen expandida */}
            <img
              src={imagenExpandida}
              alt="Imagen del comunicado ampliada"
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
