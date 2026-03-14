import { useMemo, useState, useEffect } from 'react'
import { Card, Badge, Button, Toast, Modal, SedeIndicator } from '@components/common'
import { useToast } from '@hooks/useToast'
import useAuthStore from '@features/auth/useAuthStore'
import { useClienteActual } from '@hooks/useClienteActual'
import { formatearMoneda, formatearFecha } from '@utils/formatters'
import { TIPOS_MOVIMIENTO, TIPOS_MOVIMIENTO_LABELS, TIPOS_MOVIMIENTO_COLORS, ROLES, TIPOS_PAGO_LABELS, ESTADOS_PEDIDO_LABELS } from '@utils/constants'
import { getOrderById } from '@services/OrdersService'
import { CreditService } from '@services/CreditService'

/**
 * Vista de Estado de Cuenta de Crédito
 *
 * Responsabilidad única: Mostrar el estado de cuenta unificado del cliente
 * Muestra todos los movimientos (cargos y abonos) de forma cronológica
 *
 * INTEGRACIÓN:
 * - ELM-077: Botón Ver Detalle - INTEGRADO con API-008
 * - ELM-078: Botón Recordatorio de Pago - INTEGRADO con API-024
 * - ELM-079: Botón Ver Detalle Cliente con Deuda - INTEGRADO con API-022, API-023
 * - Eliminados mocks: useMockMovimientosCredito, useNotificaciones (localStorage)
 */
const Creditos = () => {
  const { isRole, sedeIdActiva, canViewAllSedes } = useAuthStore()
  const clienteActual = useClienteActual()
  const { toast, showToast, hideToast } = useToast()

  // Estado para datos de créditos desde API
  const [clientesConDeuda, setClientesConDeuda] = useState([])
  const [estadoCuenta, setEstadoCuenta] = useState(null)
  const [cargandoDeudores, setCargandoDeudores] = useState(false)
  const [cargandoEstadoCuenta, setCargandoEstadoCuenta] = useState(false)

  // Paginación y búsqueda para lista de deudores
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalResultados, setTotalResultados] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [busquedaActiva, setBusquedaActiva] = useState('')
  const [summaryGlobal, setSummaryGlobal] = useState({ totalDeudores: 0, totalDebt: 0, totalConVencidos: 0 })
  const PAGE_SIZE = 20

  // Estado para cliente seleccionado en vista admin
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState(null)

  // Estado para modal de detalle de pedido
  const [modalPedidoAbierto, setModalPedidoAbierto] = useState(false)
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null)
  const [cargandoPedido, setCargandoPedido] = useState(false)

  // Handler para enviar recordatorio de pago
  // INTEGRADO: ELM-078 - Usa API-024 POST /api/v1/credits/customers/{customerId}/reminder
  const handleEnviarRecordatorio = async (cliente) => {
    try {
      const mensaje = `Recordatorio de pago: Tienes un saldo pendiente de ${formatearMoneda(cliente.totalDebt || cliente.saldoActual)}`

      await CreditService.sendPaymentReminder(cliente.customerId || cliente.clienteId, mensaje)

      showToast(`Recordatorio de pago enviado a ${cliente.customerName || cliente.nombreCliente}`, 'success')
    } catch (error) {
      console.error('Error enviando recordatorio:', error)
      showToast(error.message || 'No se pudo enviar el recordatorio de pago', 'error')
    }
  }

  // Handler para ver detalle de pedido
  // Integrado con API-008 GET /api/v1/orders/:id
  const handleVerDetallePedido = async (pedidoId) => {
    try {
      setCargandoPedido(true)
      const pedido = await getOrderById(pedidoId)
      setPedidoSeleccionado(pedido)
      setModalPedidoAbierto(true)
    } catch (error) {
      console.error('Error cargando detalle del pedido:', error)
      showToast(error.message || 'No se pudo cargar el detalle del pedido', 'error')
    } finally {
      setCargandoPedido(false)
    }
  }

  // Handler para cerrar modal
  const handleCerrarModal = () => {
    setModalPedidoAbierto(false)
    setPedidoSeleccionado(null)
  }

  // INTEGRADO: ELM-079 - Cargar lista de clientes con deuda usando API-022
  useEffect(() => {
    const cargarClientesConDeuda = async () => {
      if (!isRole(ROLES.ADMINISTRADOR) && !isRole(ROLES.COORDINADOR) && !isRole(ROLES.SUPERADMINISTRADOR)) {
        return
      }

      try {
        setCargandoDeudores(true)
        const branchId = canViewAllSedes() ? null : sedeIdActiva
        const result = await CreditService.getDebtors({
          branchId,
          page: paginaActual,
          pageSize: PAGE_SIZE,
          search: busquedaActiva || undefined
        })

        // Mapear respuesta de API al formato esperado por la UI
        const clientesMapeados = (result.data || []).map(cliente => ({
          clienteId: cliente.customerId,
          nombreCliente: cliente.customerName,
          saldoActual: cliente.totalDebt,
          tieneCargosVencidos: cliente.overdueCharges > 0,
          cantidadMovimientos: cliente.movementCount || 0,
          // Solo mostrar botón recordatorio si la ruta del cliente ya salió hoy
          puedeEnviarRecordatorio: cliente.canSendReminder === true,
          customerId: cliente.customerId,
          customerName: cliente.customerName,
          totalDebt: cliente.totalDebt
        }))

        setClientesConDeuda(clientesMapeados)
        setTotalPaginas(result.pagination?.totalPages || 1)
        setTotalResultados(result.pagination?.total || 0)
        if (result.summary) {
          setSummaryGlobal(result.summary)
        }
      } catch (error) {
        console.error('Error cargando clientes con deuda:', error)
        showToast(error.message || 'Error al cargar clientes con deuda', 'error')
      } finally {
        setCargandoDeudores(false)
      }
    }

    cargarClientesConDeuda()
  }, [isRole, sedeIdActiva, canViewAllSedes, paginaActual, busquedaActiva])

  // INTEGRADO: Cargar estado de cuenta del cliente (para rol CLIENTE) usando API-021
  useEffect(() => {
    const cargarMiEstadoCuenta = async () => {
      if (!isRole(ROLES.CLIENTE) || !clienteActual) {
        return
      }

      try {
        setCargandoEstadoCuenta(true)
        const result = await CreditService.getMyAccount()

        // Mapear respuesta de API al formato esperado por la UI
        setEstadoCuenta({
          clienteId: clienteActual.id,
          nombreCliente: clienteActual.nombre,
          emailCliente: clienteActual.email,
          saldoActual: result.currentBalance || 0,
          tieneCargosVencidos: (result.movements || []).some(m => m.esVencido),
          movimientos: result.movements || [],
          cantidadMovimientos: (result.movements || []).length
        })
      } catch (error) {
        console.error('Error cargando mi estado de cuenta:', error)
        showToast(error.message || 'Error al cargar estado de cuenta', 'error')
      } finally {
        setCargandoEstadoCuenta(false)
      }
    }

    cargarMiEstadoCuenta()
  }, [isRole, clienteActual])

  // INTEGRADO: ELM-079 - Cargar estado de cuenta del cliente seleccionado usando API-023
  const [estadoCuentaSeleccionado, setEstadoCuentaSeleccionado] = useState(null)

  useEffect(() => {
    const cargarEstadoCuentaSeleccionado = async () => {
      if (!clienteSeleccionadoId) {
        setEstadoCuentaSeleccionado(null)
        return
      }

      try {
        setCargandoEstadoCuenta(true)
        const result = await CreditService.getCustomerAccount(clienteSeleccionadoId)

        // Mapear respuesta de API al formato esperado por la UI
        setEstadoCuentaSeleccionado({
          clienteId: result.customer.id,
          nombreCliente: result.customer.name,
          emailCliente: result.customer.email,
          saldoActual: result.currentBalance || 0,
          tieneCargosVencidos: (result.movements || []).some(m => m.esVencido),
          movimientos: result.movements || [],
          cantidadMovimientos: (result.movements || []).length
        })
      } catch (error) {
        console.error('Error cargando estado de cuenta del cliente:', error)
        showToast(error.message || 'Error al cargar estado de cuenta', 'error')
        setClienteSeleccionadoId(null)
      } finally {
        setCargandoEstadoCuenta(false)
      }
    }

    cargarEstadoCuentaSeleccionado()
  }, [clienteSeleccionadoId])

  // Estadísticas globales desde el backend (no dependen de paginación)
  const estadisticas = useMemo(() => {
    return {
      totalConDeuda: summaryGlobal.totalDeudores,
      totalConDeudaVencida: summaryGlobal.totalConVencidos,
      montoTotalPendiente: summaryGlobal.totalDebt
    }
  }, [summaryGlobal])

  // Función para renderizar el estado de cuenta (reutilizable)
  const renderEstadoCuenta = (estadoCuenta, esAdmin = false) => {
    if (!estadoCuenta) return null

    return (
      <div className="space-y-6">
        {/* Botón volver (solo para admin) */}
        {esAdmin && (
          <Button
            variant="secondary"
            onClick={() => setClienteSeleccionadoId(null)}
          >
            ← Volver a la lista
          </Button>
        )}

        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {esAdmin ? `Estado de Cuenta - ${estadoCuenta.nombreCliente}` : 'Mi Estado de Cuenta'}
          </h2>
          <p className="text-gray-600 mt-1">
            {esAdmin && estadoCuenta.emailCliente && (
              <span>{estadoCuenta.emailCliente} • </span>
            )}
            Historial completo de cargos y abonos
          </p>
        </div>

        {/* Resumen de la cuenta - Saldo Actual */}
        <Card className="border-l-4 border-red-500">
          <div>
            <p className="text-sm text-gray-600">Saldo Actual</p>
            <p className={`text-3xl font-bold ${estadoCuenta.saldoActual > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatearMoneda(estadoCuenta.saldoActual)}
            </p>
            {estadoCuenta.tieneCargosVencidos && (
              <Badge variant="danger" className="mt-2">Con cargos vencidos</Badge>
            )}
          </div>
        </Card>

        {/* Estado de cuenta - Movimientos */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Movimientos</h3>

          {estadoCuenta.movimientos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay movimientos en {esAdmin ? 'la cuenta de este cliente' : 'tu cuenta'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {estadoCuenta.movimientos.map((movimiento) => {
                // CARGO y SALDO_INICIAL aumentan la deuda, ABONO la disminuye
                const esDeuda = movimiento.tipo === TIPOS_MOVIMIENTO.CARGO || movimiento.tipo === TIPOS_MOVIMIENTO.SALDO_INICIAL
                const esAbono = movimiento.tipo === TIPOS_MOVIMIENTO.ABONO

                // Estilos según tipo
                const bgClass = esDeuda
                  ? (movimiento.tipo === TIPOS_MOVIMIENTO.SALDO_INICIAL ? 'bg-yellow-50 border-yellow-500' : 'bg-red-50 border-red-500')
                  : 'bg-green-50 border-green-500'
                const textClass = esDeuda
                  ? (movimiento.tipo === TIPOS_MOVIMIENTO.SALDO_INICIAL ? 'text-yellow-900' : 'text-red-900')
                  : 'text-green-900'
                const icon = movimiento.tipo === TIPOS_MOVIMIENTO.SALDO_INICIAL ? '📋' : (esDeuda ? '📦' : '💵')

                return (
                  <div
                    key={movimiento.id}
                    className={`flex justify-between items-center p-4 rounded-lg border-l-4 ${bgClass}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{icon}</span>
                        <div>
                          <p className={`font-semibold ${textClass}`}>
                            {movimiento.referencia}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatearFecha(movimiento.fechaMovimiento)}
                            {movimiento.tipo === TIPOS_MOVIMIENTO.CARGO && movimiento.fechaVencimiento && (
                              <span className="ml-2">
                                • Vence: {formatearFecha(movimiento.fechaVencimiento)}
                              </span>
                            )}
                          </p>
                          {/* Badge de VENCIDO para créditos que ya pasaron su fecha de vencimiento */}
                          {movimiento.tipo === TIPOS_MOVIMIENTO.CARGO && movimiento.esVencido && (
                            <Badge variant="danger" className="mt-1 animate-pulse">
                              ⚠️ VENCIDO
                            </Badge>
                          )}
                          {movimiento.notas && (
                            <p className="text-xs text-gray-500 italic mt-1">{movimiento.notas}</p>
                          )}
                          {/* Botón Ver Detalle para cargos con pedido */}
                          {movimiento.tipo === TIPOS_MOVIMIENTO.CARGO && movimiento.pedidoId && (
                            <div className="mt-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleVerDetallePedido(movimiento.pedidoId)}
                              >
                                👁️ Ver Detalle
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <Badge variant={TIPOS_MOVIMIENTO_COLORS[movimiento.tipo] || 'secondary'} className="mb-2">
                        {TIPOS_MOVIMIENTO_LABELS[movimiento.tipo] || movimiento.tipo}
                      </Badge>
                      <p className={`text-xl font-bold ${textClass}`}>
                        {esAbono ? '-' : '+'}
                        {formatearMoneda(movimiento.monto)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Saldo: {formatearMoneda(movimiento.saldo)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Resumen final */}
        <Card className="bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total de Movimientos</p>
              <p className="text-lg font-semibold">
                {estadoCuenta.cantidadMovimientos} movimiento(s)
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Saldo Final</p>
              <p className={`text-3xl font-bold ${estadoCuenta.saldoActual > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatearMoneda(estadoCuenta.saldoActual)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Vista para CLIENTE: Su estado de cuenta personal
  if (isRole(ROLES.CLIENTE)) {
    if (!estadoCuenta) {
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Mi Estado de Cuenta</h1>
          <Card>
            <div className="text-center py-12 text-gray-500">
              <p>No se encontró información de cuenta</p>
            </div>
          </Card>
        </div>
      )
    }

    return (
      <>
        {renderEstadoCuenta(estadoCuenta, false)}

        {/* Modal de detalle de pedido */}
        <Modal
          isOpen={modalPedidoAbierto}
          onClose={handleCerrarModal}
          title={pedidoSeleccionado ? `Detalle del Pedido #${pedidoSeleccionado.numero || pedidoSeleccionado.id}` : 'Cargando...'}
          size="lg"
        >
          {cargandoPedido ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando detalle del pedido...</p>
              </div>
            </div>
          ) : pedidoSeleccionado ? (
            <div className="space-y-6">
              {/* Información del pedido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Fecha del Pedido</p>
                  <p className="font-semibold">{formatearFecha(pedidoSeleccionado.fecha)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <Badge variant="success">{ESTADOS_PEDIDO_LABELS[pedidoSeleccionado.estado]}</Badge>
                </div>
              </div>

              {/* Información del cliente */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Información del Cliente</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Nombre</p>
                    <p className="font-medium">{pedidoSeleccionado.nombreCliente}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Dirección</p>
                    <p className="font-medium">{pedidoSeleccionado.direccionCliente || 'No especificada'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Teléfono</p>
                    <p className="font-medium">{pedidoSeleccionado.telefonoCliente || 'No especificado'}</p>
                  </div>
                </div>
              </div>

              {/* Productos del pedido */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Productos</h4>
                <div className="space-y-3">
                  {pedidoSeleccionado.detalles && pedidoSeleccionado.detalles.length > 0 ? (
                    pedidoSeleccionado.detalles.map((detalle, index) => (
                      <div
                        key={detalle.id || index}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{detalle.nombreProducto}</p>
                          <p className="text-sm text-gray-600">
                            Cantidad: {detalle.cantidad}
                          </p>
                          <p className="text-sm text-gray-600">
                            Precio unitario: {formatearMoneda(detalle.precioUnitario)}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-gray-900">
                            {formatearMoneda(detalle.subtotal)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">Sin productos</p>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold text-gray-900">Total del Pedido</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatearMoneda(pedidoSeleccionado.total)}
                  </p>
                </div>
              </div>

              {/* Información de pago */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Información de Pago</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Tipo de Pago</p>
                    <p className="font-medium">{TIPOS_PAGO_LABELS[pedidoSeleccionado.tipoPago]}</p>
                  </div>
                  {pedidoSeleccionado.tipoPago === 'credito' && pedidoSeleccionado.diasCredito && (
                    <div>
                      <p className="text-gray-600">Días de Crédito</p>
                      <p className="font-medium">{pedidoSeleccionado.diasCredito} días</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notas */}
              {pedidoSeleccionado.observaciones && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Observaciones</h4>
                  <p className="text-sm text-gray-600 italic">{pedidoSeleccionado.observaciones}</p>
                </div>
              )}

              {/* Botón cerrar */}
              <div className="flex justify-end pt-4 border-t">
                <Button variant="secondary" onClick={handleCerrarModal}>
                  Cerrar
                </Button>
              </div>
            </div>
          ) : null}
        </Modal>
      </>
    )
  }

  // Vista para ADMIN/COORDINADOR
  // Si hay un cliente seleccionado, mostrar su estado de cuenta
  if (clienteSeleccionadoId) {
    return (
      <>
        <div className="space-y-6">
          {renderEstadoCuenta(estadoCuentaSeleccionado, true)}
        </div>

        {/* Modal de detalle de pedido */}
        <Modal
          isOpen={modalPedidoAbierto}
          onClose={handleCerrarModal}
          title={pedidoSeleccionado ? `Detalle del Pedido #${pedidoSeleccionado.numero || pedidoSeleccionado.id}` : 'Cargando...'}
          size="lg"
        >
          {cargandoPedido ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando detalle del pedido...</p>
              </div>
            </div>
          ) : pedidoSeleccionado ? (
            <div className="space-y-6">
              {/* Información del pedido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Fecha del Pedido</p>
                  <p className="font-semibold">{formatearFecha(pedidoSeleccionado.fecha)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <Badge variant="success">{ESTADOS_PEDIDO_LABELS[pedidoSeleccionado.estado]}</Badge>
                </div>
              </div>

              {/* Información del cliente */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Información del Cliente</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Nombre</p>
                    <p className="font-medium">{pedidoSeleccionado.nombreCliente}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Dirección</p>
                    <p className="font-medium">{pedidoSeleccionado.direccionCliente || 'No especificada'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Teléfono</p>
                    <p className="font-medium">{pedidoSeleccionado.telefonoCliente || 'No especificado'}</p>
                  </div>
                </div>
              </div>

              {/* Productos del pedido */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Productos</h4>
                <div className="space-y-3">
                  {pedidoSeleccionado.detalles && pedidoSeleccionado.detalles.length > 0 ? (
                    pedidoSeleccionado.detalles.map((detalle, index) => (
                      <div
                        key={detalle.id || index}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{detalle.nombreProducto}</p>
                          <p className="text-sm text-gray-600">
                            Cantidad: {detalle.cantidad}
                          </p>
                          <p className="text-sm text-gray-600">
                            Precio unitario: {formatearMoneda(detalle.precioUnitario)}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-gray-900">
                            {formatearMoneda(detalle.subtotal)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">Sin productos</p>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold text-gray-900">Total del Pedido</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatearMoneda(pedidoSeleccionado.total)}
                  </p>
                </div>
              </div>

              {/* Información de pago */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Información de Pago</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Tipo de Pago</p>
                    <p className="font-medium">{TIPOS_PAGO_LABELS[pedidoSeleccionado.tipoPago]}</p>
                  </div>
                  {pedidoSeleccionado.tipoPago === 'credito' && pedidoSeleccionado.diasCredito && (
                    <div>
                      <p className="text-gray-600">Días de Crédito</p>
                      <p className="font-medium">{pedidoSeleccionado.diasCredito} días</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notas */}
              {pedidoSeleccionado.observaciones && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Observaciones</h4>
                  <p className="text-sm text-gray-600 italic">{pedidoSeleccionado.observaciones}</p>
                </div>
              )}

              {/* Botón cerrar */}
              <div className="flex justify-end pt-4 border-t">
                <Button variant="secondary" onClick={handleCerrarModal}>
                  Cerrar
                </Button>
              </div>
            </div>
          ) : null}
        </Modal>
      </>
    )
  }

  // Vista para ADMIN/COORDINADOR: Lista de clientes con deuda
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Créditos</h1>
          <SedeIndicator size="sm" />
        </div>
        <p className="text-gray-600 mt-1">Estados de cuenta de clientes</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clientes con Deuda</p>
              <p className="text-2xl font-bold">{estadisticas.totalConDeuda}</p>
            </div>
            <span className="text-3xl">👥</span>
          </div>
        </Card>

        <Card className="border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Con Deuda Vencida</p>
              <p className="text-2xl font-bold text-red-600">{estadisticas.totalConDeudaVencida}</p>
            </div>
            <span className="text-3xl">⚠️</span>
          </div>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Por Cobrar</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatearMoneda(estadisticas.montoTotalPendiente)}
              </p>
            </div>
            <span className="text-3xl">💰</span>
          </div>
        </Card>
      </div>

      {/* Lista de clientes con deuda */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold">Clientes con Deuda</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setPaginaActual(1)
              setBusquedaActiva(busqueda)
            }}
            className="flex gap-2 w-full sm:w-auto"
          >
            <div className="relative flex-1 sm:w-72">
              <input
                type="text"
                placeholder="Buscar por nombre de cliente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Button type="submit" variant="primary" size="sm">Buscar</Button>
            {busquedaActiva && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setBusqueda('')
                  setBusquedaActiva('')
                  setPaginaActual(1)
                }}
              >
                Limpiar
              </Button>
            )}
          </form>
        </div>

        {busquedaActiva && (
          <p className="text-sm text-gray-500 mb-3">
            Mostrando resultados para "<span className="font-medium">{busquedaActiva}</span>" — {totalResultados} encontrado(s)
          </p>
        )}

        {cargandoDeudores ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Cargando clientes...</p>
            </div>
          </div>
        ) : clientesConDeuda.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>{busquedaActiva ? 'No se encontraron clientes con ese nombre' : 'No hay clientes con deuda pendiente'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clientesConDeuda.map((estado) => (
              <div
                key={estado.clienteId}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👤</span>
                    <div>
                      <p className="font-semibold text-gray-900">{estado.nombreCliente}</p>
                      <p className="text-sm text-gray-600">
                        {estado.cantidadMovimientos} movimiento(s)
                        {estado.tieneCargosVencidos && (
                          <Badge variant="danger" className="ml-2">Con cargos vencidos</Badge>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Saldo Actual</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatearMoneda(estado.saldoActual)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {estado.puedeEnviarRecordatorio && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleEnviarRecordatorio(estado)}
                      >
                        📧 Recordatorio de Pago
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setClienteSeleccionadoId(estado.clienteId)}
                    >
                      Ver Detalle
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Página {paginaActual} de {totalPaginas} ({totalResultados} clientes)
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={paginaActual <= 1}
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                let page
                if (totalPaginas <= 5) {
                  page = i + 1
                } else if (paginaActual <= 3) {
                  page = i + 1
                } else if (paginaActual >= totalPaginas - 2) {
                  page = totalPaginas - 4 + i
                } else {
                  page = paginaActual - 2 + i
                }
                return (
                  <button
                    key={page}
                    onClick={() => setPaginaActual(page)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      page === paginaActual
                        ? 'bg-primary-600 text-white font-semibold'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
              <Button
                variant="secondary"
                size="sm"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Toast de notificaciones */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}

      {/* Modal de detalle de pedido */}
      <Modal
        isOpen={modalPedidoAbierto}
        onClose={handleCerrarModal}
        title={pedidoSeleccionado ? `Detalle del Pedido #${pedidoSeleccionado.id}` : ''}
        size="lg"
      >
        {pedidoSeleccionado && (
          <div className="space-y-6">
            {/* Información del pedido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Fecha del Pedido</p>
                <p className="font-semibold">{formatearFecha(pedidoSeleccionado.fecha)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <Badge variant="success">{ESTADOS_PEDIDO_LABELS[pedidoSeleccionado.estado]}</Badge>
              </div>
            </div>

            {/* Información del cliente */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Información del Cliente</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Nombre</p>
                  <p className="font-medium">{pedidoSeleccionado.nombreCliente}</p>
                </div>
                <div>
                  <p className="text-gray-600">Dirección</p>
                  <p className="font-medium">{pedidoSeleccionado.direccionCliente || 'No especificada'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Teléfono</p>
                  <p className="font-medium">{pedidoSeleccionado.telefonoCliente || 'No especificado'}</p>
                </div>
              </div>
            </div>

            {/* Productos del pedido */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Productos</h4>
              <div className="space-y-3">
                {pedidoSeleccionado.detalles.map((detalle, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{detalle.nombreProducto}</p>
                      <p className="text-sm text-gray-600">
                        {detalle.cantidad} bolsas × {detalle.kilosPorBolsa} kg/bolsa = {detalle.totalKilos} kg
                      </p>
                      <p className="text-sm text-gray-600">
                        Precio: {formatearMoneda(detalle.precioKg)}/kg
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-gray-900">
                        {formatearMoneda(detalle.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold text-gray-900">Total del Pedido</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatearMoneda(pedidoSeleccionado.total)}
                </p>
              </div>
            </div>

            {/* Información de pago */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Información de Pago</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Tipo de Pago</p>
                  <p className="font-medium">{TIPOS_PAGO_LABELS[pedidoSeleccionado.tipoPago]}</p>
                </div>
                {pedidoSeleccionado.tipoPago === 'credito' && (
                  <div>
                    <p className="text-gray-600">Días de Crédito</p>
                    <p className="font-medium">{pedidoSeleccionado.diasCredito || 'No especificado'} días</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notas */}
            {pedidoSeleccionado.notas && (
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Notas</h4>
                <p className="text-sm text-gray-600 italic">{pedidoSeleccionado.notas}</p>
              </div>
            )}

            {/* Botón cerrar */}
            <div className="flex justify-end pt-4 border-t">
              <Button variant="secondary" onClick={handleCerrarModal}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Creditos
