import { useMemo, useState, useEffect, useCallback } from 'react'
import { Card, Badge, Button, Toast, Modal, SedeIndicator, Input, Select, SignaturePad, DateRangePicker } from '@components/common'
import { useToast } from '@hooks/useToast'
import useAuthStore from '@features/auth/useAuthStore'
import { useClienteActual } from '@hooks/useClienteActual'
import { formatearMoneda, formatearFecha } from '@utils/formatters'
import { TIPOS_MOVIMIENTO, TIPOS_MOVIMIENTO_LABELS, TIPOS_MOVIMIENTO_COLORS, ROLES, TIPOS_PAGO_LABELS, ESTADOS_PEDIDO_LABELS, METODOS_PAGO, METODOS_PAGO_LABELS } from '@utils/constants'
import { getOrderById } from '@services/OrdersService'
import { CreditService } from '@services/CreditService'

// El dinero se opera en céntimos enteros para evitar errores de punto flotante
const aCentimos = (valor) => Math.round((Number(valor) || 0) * 100)

/**
 * Reparte un monto entre los cargos pendientes de un cliente
 *
 * Replica la regla que aplica el backend al registrar el pago: primero los cargos
 * que el usuario seleccionó (del más antiguo al más reciente entre ellos) y luego
 * el resto, también del más antiguo al más reciente.
 *
 * @param {number|string} monto - Monto a repartir
 * @param {number[]} seleccionados - IDs de los cargos elegidos por el usuario
 * @param {Array} pendientes - Cargos pendientes ordenados del más antiguo al más reciente
 * @returns {{ reparto: Map<number, {aplicado: number, cubreTotal: boolean}>, sobrante: number }}
 */
const calcularRepartoPago = (monto, seleccionados, pendientes) => {
  let restante = aCentimos(monto)
  const reparto = new Map()

  if (restante <= 0 || !Array.isArray(pendientes) || pendientes.length === 0) {
    return { reparto, sobrante: restante / 100 }
  }

  const marcados = new Set(seleccionados)
  const orden = [
    ...pendientes.filter(c => marcados.has(c.id)),
    ...pendientes.filter(c => !marcados.has(c.id))
  ]

  for (const cargo of orden) {
    if (restante <= 0) break

    const pendienteCent = aCentimos(cargo.montoPendiente)
    if (pendienteCent <= 0) continue

    const aplicarCent = Math.min(restante, pendienteCent)
    restante -= aplicarCent

    reparto.set(cargo.id, {
      aplicado: aplicarCent / 100,
      cubreTotal: aplicarCent >= pendienteCent
    })
  }

  return { reparto, sobrante: restante / 100 }
}

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

  // Paginación de movimientos del estado de cuenta
  const [paginaMovimientos, setPaginaMovimientos] = useState(1)
  const [totalPaginasMovimientos, setTotalPaginasMovimientos] = useState(1)
  const [totalMovimientos, setTotalMovimientos] = useState(0)
  const PAGE_SIZE_MOVIMIENTOS = 15

  // Estado para exportación a Excel
  const [exportando, setExportando] = useState(false)
  const [rangoFechas, setRangoFechas] = useState({ startDate: '', endDate: '' })

  // Estado para el modal de registro de pago (ABONO)
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false)
  const [clientePago, setClientePago] = useState(null)
  const [registrandoPago, setRegistrandoPago] = useState(false)
  const [formPago, setFormPago] = useState({ monto: '', metodoPago: '', referencia: '', notas: '', firma: null })
  const [erroresPago, setErroresPago] = useState({})

  // Cargos pendientes del cliente y los que el usuario eligió cancelar
  const [cargosPendientes, setCargosPendientes] = useState([])
  const [cargandoCargos, setCargandoCargos] = useState(false)
  const [cargosSeleccionados, setCargosSeleccionados] = useState([])

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

  // Handler para exportar créditos de clientes a Excel
  // Si hay un rango de fechas seleccionado, el detalle de movimientos se filtra por ese periodo.
  // Con customerId se exporta el estado de cuenta de un solo cliente.
  const handleExportarExcel = async (customerId = null) => {
    try {
      setExportando(true)
      const branchId = canViewAllSedes() ? null : sedeIdActiva
      const { filename } = await CreditService.exportDebtors({
        branchId,
        search: customerId ? undefined : (busquedaActiva || undefined),
        customerId: customerId || undefined,
        dateFrom: rangoFechas.startDate || undefined,
        dateTo: rangoFechas.endDate || undefined
      })
      showToast(`Exportado correctamente: ${filename}`, 'success')
    } catch (error) {
      console.error('Error exportando créditos:', error)
      showToast(error.message || 'No se pudo exportar a Excel', 'error')
    } finally {
      setExportando(false)
    }
  }

  // ---- Registro de pago (ABONO) desde la propia vista de créditos ----

  // Abre el modal de pago y carga los cargos pendientes del cliente
  const handleAbrirModalPago = async (cliente) => {
    setClientePago({
      clienteId: cliente.clienteId,
      nombreCliente: cliente.nombreCliente,
      saldoActual: cliente.saldoActual || 0
    })
    setFormPago({ monto: '', metodoPago: '', referencia: '', notas: '', firma: null })
    setErroresPago({})
    setCargosSeleccionados([])
    setCargosPendientes([])
    setModalPagoAbierto(true)

    try {
      setCargandoCargos(true)
      const result = await CreditService.getPendingCharges(cliente.clienteId)
      setCargosPendientes(result.data || [])
    } catch (error) {
      console.error('Error cargando cargos pendientes:', error)
      showToast(error.message || 'No se pudieron cargar los cargos pendientes', 'error')
    } finally {
      setCargandoCargos(false)
    }
  }

  const handleCerrarModalPago = () => {
    if (registrandoPago) return
    setModalPagoAbierto(false)
    setClientePago(null)
    setErroresPago({})
    setCargosPendientes([])
    setCargosSeleccionados([])
  }

  // Marcar/desmarcar un cargo: el monto se sincroniza con la suma de lo seleccionado
  const handleToggleCargo = (cargoId) => {
    setCargosSeleccionados(prev => {
      const siguiente = prev.includes(cargoId)
        ? prev.filter(id => id !== cargoId)
        : [...prev, cargoId]

      const total = cargosPendientes
        .filter(c => siguiente.includes(c.id))
        .reduce((acc, c) => acc + c.montoPendiente, 0)

      // Sin selección se vuelve al monto libre; con selección se propone su suma
      setFormPago(f => ({ ...f, monto: siguiente.length > 0 ? total.toFixed(2) : '' }))
      setErroresPago(e => ({ ...e, monto: null }))
      return siguiente
    })
  }

  // Marca todos los cargos pendientes o limpia la selección
  const handleToggleTodosCargos = () => {
    const todosMarcados = cargosPendientes.length > 0 && cargosSeleccionados.length === cargosPendientes.length

    if (todosMarcados) {
      setCargosSeleccionados([])
      setFormPago(f => ({ ...f, monto: '' }))
      return
    }

    const total = cargosPendientes.reduce((acc, c) => acc + c.montoPendiente, 0)
    setCargosSeleccionados(cargosPendientes.map(c => c.id))
    setFormPago(f => ({ ...f, monto: total.toFixed(2) }))
    setErroresPago(e => ({ ...e, monto: null }))
  }

  const handleCambioFormPago = (e) => {
    const { name, value } = e.target

    // El monto y la selección de cargos están vinculados en ambos sentidos:
    // al escribir un monto se marcan las cuentas que alcanza a cubrir
    if (name === 'monto') {
      handleCambioMonto(value)
      return
    }

    setFormPago(prev => ({ ...prev, [name]: value }))
    if (erroresPago[name]) {
      setErroresPago(prev => ({ ...prev, [name]: null }))
    }
  }

  // Escribir un monto marca automáticamente las cuentas que cubre.
  // Se respeta lo que el usuario ya había elegido: el monto se reparte primero entre
  // esos cargos y solo el excedente pasa a los demás (del más antiguo al más reciente).
  const handleCambioMonto = (valor) => {
    setFormPago(prev => ({ ...prev, monto: valor }))
    setErroresPago(prev => ({ ...prev, monto: null }))

    const { reparto } = calcularRepartoPago(valor, cargosSeleccionados, cargosPendientes)
    setCargosSeleccionados(cargosPendientes.filter(c => reparto.has(c.id)).map(c => c.id))
  }

  const handleFirmaPago = (firma) => {
    setFormPago(prev => ({ ...prev, firma }))
  }

  // Registra el abono vía API-025 y refresca lo que esté visible en pantalla
  const handleRegistrarPago = async (e) => {
    e.preventDefault()
    if (!clientePago) return

    const errores = {}
    const monto = Number(formPago.monto)

    if (!formPago.monto || isNaN(monto) || monto <= 0) {
      errores.monto = 'Ingresa un monto válido'
    } else if (monto > clientePago.saldoActual + 0.001) {
      errores.monto = `El monto no puede ser mayor a la deuda actual (${formatearMoneda(clientePago.saldoActual)})`
    }

    if (!formPago.metodoPago) {
      errores.metodoPago = 'Selecciona un método de pago'
    }

    setErroresPago(errores)
    if (Object.keys(errores).length > 0) return

    try {
      setRegistrandoPago(true)
      const result = await CreditService.registerPayment({
        customerId: clientePago.clienteId,
        amount: monto,
        paymentMethod: formPago.metodoPago,
        reference: formPago.referencia,
        notes: formPago.notas,
        signature: formPago.firma,
        chargeIds: cargosSeleccionados
      })

      // Detalle de a qué cargos se aplicó el pago
      const aplicados = result.appliedCharges || []
      const cancelados = aplicados.filter(a => a.fullyPaid).length
      const detalle = aplicados.length > 0
        ? ` Se aplicó a ${aplicados.length} cargo(s)${cancelados > 0 ? `, ${cancelados} cancelado(s) por completo` : ''}.`
        : ''

      showToast(
        `Pago de ${formatearMoneda(monto)} registrado.${detalle} Nuevo saldo de ${clientePago.nombreCliente}: ${formatearMoneda(result.newBalance ?? 0)}`,
        'success'
      )

      setModalPagoAbierto(false)
      setClientePago(null)
      setFormPago({ monto: '', metodoPago: '', referencia: '', notas: '', firma: null })
      setCargosPendientes([])
      setCargosSeleccionados([])

      // Refrescar la lista de deudores y, si está abierto, el estado de cuenta
      await cargarClientesConDeuda()
      if (clienteSeleccionadoId) {
        if (paginaMovimientos !== 1) {
          // El abono queda como movimiento más reciente: se vuelve a la primera página
          setPaginaMovimientos(1)
        } else {
          await cargarEstadoCuentaSeleccionado()
        }
      }
    } catch (error) {
      console.error('Error registrando pago:', error)
      showToast(error.message || 'No se pudo registrar el pago', 'error')
    } finally {
      setRegistrandoPago(false)
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
  const cargarClientesConDeuda = useCallback(async () => {
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
  }, [isRole, sedeIdActiva, canViewAllSedes, paginaActual, busquedaActiva])

  useEffect(() => {
    cargarClientesConDeuda()
  }, [cargarClientesConDeuda])

  // INTEGRADO: Cargar estado de cuenta del cliente (para rol CLIENTE) usando API-021
  // Paginado: solo se traen los movimientos de la pagina visible
  const cargarMiEstadoCuenta = useCallback(async () => {
    if (!isRole(ROLES.CLIENTE) || !clienteActual) {
      return
    }

    try {
      setCargandoEstadoCuenta(true)
      const result = await CreditService.getMyAccount({
        page: paginaMovimientos,
        pageSize: PAGE_SIZE_MOVIMIENTOS
      })

      // Mapear respuesta de API al formato esperado por la UI
      setEstadoCuenta({
        clienteId: clienteActual.id,
        nombreCliente: clienteActual.nombre,
        emailCliente: clienteActual.email,
        saldoActual: result.currentBalance || 0,
        tieneCargosVencidos: (result.movements || []).some(m => m.esVencido),
        movimientos: result.movements || [],
        cantidadMovimientos: result.pagination?.total ?? (result.movements || []).length
      })
      setTotalPaginasMovimientos(result.pagination?.totalPages || 1)
      setTotalMovimientos(result.pagination?.total ?? (result.movements || []).length)
    } catch (error) {
      console.error('Error cargando mi estado de cuenta:', error)
      showToast(error.message || 'Error al cargar estado de cuenta', 'error')
    } finally {
      setCargandoEstadoCuenta(false)
    }
  }, [isRole, clienteActual, paginaMovimientos])

  useEffect(() => {
    cargarMiEstadoCuenta()
  }, [cargarMiEstadoCuenta])

  // INTEGRADO: ELM-079 - Cargar estado de cuenta del cliente seleccionado usando API-023
  const [estadoCuentaSeleccionado, setEstadoCuentaSeleccionado] = useState(null)

  // Paginado: cada pagina trae solo su bloque de movimientos desde el backend
  const cargarEstadoCuentaSeleccionado = useCallback(async () => {
    if (!clienteSeleccionadoId) {
      setEstadoCuentaSeleccionado(null)
      return
    }

    try {
      setCargandoEstadoCuenta(true)
      const result = await CreditService.getCustomerAccount(clienteSeleccionadoId, {
        page: paginaMovimientos,
        pageSize: PAGE_SIZE_MOVIMIENTOS
      })

      // Mapear respuesta de API al formato esperado por la UI
      setEstadoCuentaSeleccionado({
        clienteId: result.customer.id,
        nombreCliente: result.customer.name,
        emailCliente: result.customer.email,
        saldoActual: result.currentBalance || 0,
        tieneCargosVencidos: (result.movements || []).some(m => m.esVencido),
        movimientos: result.movements || [],
        cantidadMovimientos: result.pagination?.total ?? (result.movements || []).length
      })
      setTotalPaginasMovimientos(result.pagination?.totalPages || 1)
      setTotalMovimientos(result.pagination?.total ?? (result.movements || []).length)
    } catch (error) {
      console.error('Error cargando estado de cuenta del cliente:', error)
      showToast(error.message || 'Error al cargar estado de cuenta', 'error')
      setClienteSeleccionadoId(null)
    } finally {
      setCargandoEstadoCuenta(false)
    }
  }, [clienteSeleccionadoId, paginaMovimientos])

  useEffect(() => {
    cargarEstadoCuentaSeleccionado()
  }, [cargarEstadoCuentaSeleccionado])

  // Al abrir el estado de cuenta de otro cliente siempre se parte de la pagina 1
  const handleSeleccionarCliente = (clienteId) => {
    setPaginaMovimientos(1)
    setClienteSeleccionadoId(clienteId)
  }

  const handleVolverALista = () => {
    setClienteSeleccionadoId(null)
    setPaginaMovimientos(1)
  }

  // Opciones del selector de método de pago del modal de registro
  const metodosPagoOptions = useMemo(
    () => Object.values(METODOS_PAGO).map(metodo => ({
      value: metodo,
      label: METODOS_PAGO_LABELS[metodo]
    })),
    []
  )

  // Estadísticas globales desde el backend (no dependen de paginación)
  const estadisticas = useMemo(() => {
    return {
      totalConDeuda: summaryGlobal.totalDeudores,
      totalConDeudaVencida: summaryGlobal.totalConVencidos,
      montoTotalPendiente: summaryGlobal.totalDebt
    }
  }, [summaryGlobal])

  // Controles de paginación de los movimientos del estado de cuenta
  // Los movimientos se piden página por página al backend (API-021 / API-023),
  // de modo que también se pueda llegar a los más antiguos.
  const renderPaginacionMovimientos = () => {
    if (totalPaginasMovimientos <= 1) return null

    const paginas = Array.from({ length: Math.min(5, totalPaginasMovimientos) }, (_, i) => {
      if (totalPaginasMovimientos <= 5) return i + 1
      if (paginaMovimientos <= 3) return i + 1
      if (paginaMovimientos >= totalPaginasMovimientos - 2) return totalPaginasMovimientos - 4 + i
      return paginaMovimientos - 2 + i
    })

    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Página {paginaMovimientos} de {totalPaginasMovimientos} ({totalMovimientos} movimiento(s))
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={paginaMovimientos <= 1 || cargandoEstadoCuenta}
            onClick={() => setPaginaMovimientos(1)}
          >
            « Primera
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={paginaMovimientos <= 1 || cargandoEstadoCuenta}
            onClick={() => setPaginaMovimientos(p => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          {paginas.map((page) => (
            <button
              key={page}
              type="button"
              disabled={cargandoEstadoCuenta}
              onClick={() => setPaginaMovimientos(page)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                page === paginaMovimientos
                  ? 'bg-primary-600 text-white font-semibold'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
          <Button
            variant="secondary"
            size="sm"
            disabled={paginaMovimientos >= totalPaginasMovimientos || cargandoEstadoCuenta}
            onClick={() => setPaginaMovimientos(p => Math.min(totalPaginasMovimientos, p + 1))}
          >
            Siguiente
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={paginaMovimientos >= totalPaginasMovimientos || cargandoEstadoCuenta}
            onClick={() => setPaginaMovimientos(totalPaginasMovimientos)}
          >
            Última »
          </Button>
        </div>
      </div>
    )
  }

  // Función para renderizar el estado de cuenta (reutilizable)
  const renderEstadoCuenta = (estadoCuenta, esAdmin = false) => {
    if (!estadoCuenta) return null

    return (
      <div className="space-y-6">
        {/* Botón volver (solo para admin) */}
        {esAdmin && (
          <Button
            variant="secondary"
            onClick={handleVolverALista}
          >
            ← Volver a la lista
          </Button>
        )}

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
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

          {/* Acciones del estado de cuenta (solo admin): registrar pago y exportar */}
          {esAdmin && (
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="w-full sm:w-72">
                <DateRangePicker
                  startDate={rangoFechas.startDate}
                  endDate={rangoFechas.endDate}
                  onChange={setRangoFechas}
                  maxDays={731}
                  placeholder="Filtrar movimientos por fechas"
                />
              </div>
              <Button
                variant="success"
                onClick={() => handleExportarExcel(estadoCuenta.clienteId)}
                disabled={exportando}
              >
                {exportando ? 'Exportando...' : '📊 Exportar'}
              </Button>
              {estadoCuenta.saldoActual > 0 && (
                <Button
                  variant="primary"
                  onClick={() => handleAbrirModalPago({
                    clienteId: estadoCuenta.clienteId,
                    nombreCliente: estadoCuenta.nombreCliente,
                    saldoActual: estadoCuenta.saldoActual
                  })}
                >
                  💵 Registrar Pago
                </Button>
              )}
            </div>
          )}
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
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="text-lg font-semibold">Movimientos</h3>
            {totalMovimientos > 0 && (
              <p className="text-sm text-gray-500">
                Mostrando {estadoCuenta.movimientos.length} de {totalMovimientos} movimiento(s)
              </p>
            )}
          </div>

          {estadoCuenta.movimientos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay movimientos en {esAdmin ? 'la cuenta de este cliente' : 'tu cuenta'}</p>
            </div>
          ) : (
            <div className={`space-y-3 transition-opacity ${cargandoEstadoCuenta ? 'opacity-50 pointer-events-none' : ''}`}>
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
                          {/* Estado de pago del cargo y badge de vencido (solo si le queda saldo) */}
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {esDeuda && movimiento.estadoPago === 'PAGADO' && (
                              <Badge variant="success">✅ Cancelado</Badge>
                            )}
                            {esDeuda && movimiento.estadoPago === 'PARCIAL' && (
                              <Badge variant="warning">
                                Abonado {formatearMoneda(movimiento.montoPagado)} · Pendiente {formatearMoneda(movimiento.montoPendiente)}
                              </Badge>
                            )}
                            {esDeuda && movimiento.estadoPago === 'PENDIENTE' && (
                              <Badge variant="gray">Pendiente de pago</Badge>
                            )}
                            {movimiento.tipo === TIPOS_MOVIMIENTO.CARGO && movimiento.esVencido && (
                              <Badge variant="danger" className="animate-pulse">
                                ⚠️ VENCIDO
                              </Badge>
                            )}
                          </div>
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

          {/* Paginación de movimientos */}
          {renderPaginacionMovimientos()}
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

  // Modal para registrar un pago (ABONO) sin salir de la vista de créditos
  // Reutiliza API-025 (POST /payments), la misma que usa el módulo de Pagos
  const renderModalPago = () => {
    const montoNumerico = Number(formPago.monto)
    const montoValido = formPago.monto !== '' && !isNaN(montoNumerico) && montoNumerico > 0
    const saldoRestante = clientePago ? clientePago.saldoActual - montoNumerico : 0
    const totalSeleccionado = cargosPendientes
      .filter(c => cargosSeleccionados.includes(c.id))
      .reduce((acc, c) => acc + c.montoPendiente, 0)
    const todosMarcados = cargosPendientes.length > 0 && cargosSeleccionados.length === cargosPendientes.length

    // Vista previa de cómo se repartirá el monto entre los cargos (igual que en el backend)
    const { reparto: repartoPago } = calcularRepartoPago(formPago.monto, cargosSeleccionados, cargosPendientes)
    const totalAplicado = Array.from(repartoPago.values()).reduce((acc, r) => acc + r.aplicado, 0)
    const hayParcial = Array.from(repartoPago.values()).some(r => !r.cubreTotal)

    return (
      <Modal
        isOpen={modalPagoAbierto}
        onClose={handleCerrarModalPago}
        title={clientePago ? `Registrar Pago - ${clientePago.nombreCliente}` : 'Registrar Pago'}
        size="md"
      >
        {clientePago && (
          <form onSubmit={handleRegistrarPago} className="space-y-4">
            {/* Resumen de la deuda del cliente */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Deuda actual</span>
                <span className="text-xl font-bold text-red-600">
                  {formatearMoneda(clientePago.saldoActual)}
                </span>
              </div>
              {montoValido && montoNumerico <= clientePago.saldoActual + 0.001 && (
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
                  <span className="text-sm text-gray-600">Saldo después del pago</span>
                  <span className={`text-lg font-semibold ${saldoRestante > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatearMoneda(saldoRestante)}
                  </span>
                </div>
              )}
            </div>

            {/* Selección de cargos a cancelar (opcional) */}
            <div className="border border-gray-200 rounded-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Cargos a cancelar (opcional)</p>
                  <p className="text-xs text-gray-500">
                    Si no seleccionas ninguno, el monto se aplica del cargo más antiguo al más reciente
                  </p>
                </div>
                {cargosPendientes.length > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={registrandoPago}
                    onClick={handleToggleTodosCargos}
                  >
                    {todosMarcados ? 'Quitar selección' : 'Seleccionar todos'}
                  </Button>
                )}
              </div>

              {cargandoCargos ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                    <p className="text-gray-500 text-xs">Cargando cargos pendientes...</p>
                  </div>
                </div>
              ) : cargosPendientes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  Este cliente no tiene cargos pendientes registrados
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {cargosPendientes.map((cargo) => {
                    const marcado = cargosSeleccionados.includes(cargo.id)
                    const aplicacion = repartoPago.get(cargo.id)
                    return (
                      <label
                        key={cargo.id}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                          marcado ? 'bg-primary-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => handleToggleCargo(cargo.id)}
                          disabled={registrandoPago}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{cargo.referencia}</p>
                          <p className="text-xs text-gray-600">
                            {formatearFecha(cargo.fechaMovimiento)}
                            {cargo.fechaVencimiento && ` • Vence: ${formatearFecha(cargo.fechaVencimiento)}`}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {cargo.esVencido && (
                              <Badge variant="danger">⚠️ VENCIDO</Badge>
                            )}
                            {cargo.estadoPago === 'PARCIAL' && (
                              <Badge variant="warning">
                                Abonado {formatearMoneda(cargo.montoPagado)} de {formatearMoneda(cargo.monto)}
                              </Badge>
                            )}
                            {/* Cómo queda esta cuenta con el monto ingresado */}
                            {aplicacion && (
                              aplicacion.cubreTotal ? (
                                <Badge variant="success">✅ Se cancela por completo</Badge>
                              ) : (
                                <Badge variant="warning">
                                  Parcial: se aplican {formatearMoneda(aplicacion.aplicado)}, quedan {formatearMoneda(cargo.montoPendiente - aplicacion.aplicado)}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-500">Pendiente</p>
                          <p className="text-base font-bold text-red-600">
                            {formatearMoneda(cargo.montoPendiente)}
                          </p>
                          {aplicacion && !aplicacion.cubreTotal && (
                            <p className="text-xs text-orange-600 font-medium mt-0.5">
                              Se aplican {formatearMoneda(aplicacion.aplicado)}
                            </p>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}

              {cargosSeleccionados.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-200 bg-primary-50 rounded-b-lg space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                      {cargosSeleccionados.length} cuenta(s) seleccionada(s)
                      {hayParcial && ' · una queda parcial'}
                    </span>
                    <span className="text-base font-bold text-primary-700">
                      {formatearMoneda(totalAplicado > 0 ? totalAplicado : totalSeleccionado)}
                    </span>
                  </div>
                  {totalAplicado > 0 && Math.abs(totalAplicado - totalSeleccionado) > 0.005 && (
                    <p className="text-xs text-gray-600">
                      Saldo total de las cuentas marcadas: {formatearMoneda(totalSeleccionado)}
                    </p>
                  )}
                </div>
              )}
            </div>

            <Input
              label="Monto a Pagar"
              name="monto"
              type="number"
              value={formPago.monto}
              onChange={handleCambioFormPago}
              error={erroresPago.monto}
              required
              min="0.01"
              step="0.01"
              placeholder="0.00"
              disabled={registrandoPago}
            />

            {/* Resumen de cómo queda repartido el monto ingresado */}
            {montoValido && repartoPago.size > 0 && (
              <p className="text-xs text-gray-600 -mt-2">
                Cubre {repartoPago.size} cuenta(s)
                {hayParcial
                  ? ', una de ellas de forma parcial (marcada arriba).'
                  : ', todas por completo.'}
              </p>
            )}

            <div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={registrandoPago}
                onClick={() => handleCambioMonto(clientePago.saldoActual.toFixed(2))}
              >
                Pagar deuda completa ({formatearMoneda(clientePago.saldoActual)})
              </Button>
            </div>

            <Select
              label="Método de Pago"
              name="metodoPago"
              value={formPago.metodoPago}
              onChange={handleCambioFormPago}
              options={metodosPagoOptions}
              error={erroresPago.metodoPago}
              required
              disabled={registrandoPago}
            />

            <Input
              label="Referencia / N° de operación (Opcional)"
              name="referencia"
              value={formPago.referencia}
              onChange={handleCambioFormPago}
              placeholder="N° de operación, voucher, etc."
              disabled={registrandoPago}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Notas (Opcional)</label>
              <textarea
                name="notas"
                value={formPago.notas}
                onChange={handleCambioFormPago}
                className="input"
                rows="3"
                placeholder="Observaciones del pago..."
                disabled={registrandoPago}
              />
            </div>

            <SignaturePad onSave={handleFirmaPago} required={false} />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCerrarModalPago}
                disabled={registrandoPago}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={registrandoPago}>
                {registrandoPago ? 'Registrando...' : '💵 Registrar Pago'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
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
          {!estadoCuentaSeleccionado ? (
            <>
              <Button variant="secondary" onClick={handleVolverALista}>
                ← Volver a la lista
              </Button>
              <Card>
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
                    <p className="text-gray-500 text-sm">Cargando estado de cuenta...</p>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            renderEstadoCuenta(estadoCuentaSeleccionado, true)
          )}
        </div>

        {/* Modal de registro de pago */}
        {renderModalPago()}

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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Créditos</h1>
            <SedeIndicator size="sm" />
          </div>
          <p className="text-gray-600 mt-1">Estados de cuenta de clientes</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          {/* Rango de fechas: filtra el detalle de movimientos exportado.
              Inicio y fin se eligen en el mismo calendario. */}
          <div className="w-full sm:w-80">
            <DateRangePicker
              startDate={rangoFechas.startDate}
              endDate={rangoFechas.endDate}
              onChange={setRangoFechas}
              maxDays={731}
              placeholder="Filtrar movimientos por fechas"
            />
          </div>
          <Button
            variant="success"
            onClick={() => handleExportarExcel()}
            disabled={exportando || estadisticas.totalConDeuda === 0}
          >
            {exportando ? 'Exportando...' : '📊 Exportar a Excel'}
          </Button>
        </div>
      </div>

      {(rangoFechas.startDate || rangoFechas.endDate) && (
        <p className="text-sm text-gray-600 -mt-2">
          La exportación incluirá la deuda actual de cada cliente y solo los movimientos
          {rangoFechas.startDate && ` desde el ${formatearFecha(rangoFechas.startDate)}`}
          {rangoFechas.endDate && ` hasta el ${formatearFecha(rangoFechas.endDate)}`}.
        </p>
      )}

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
                    {/* Registrar el abono del cliente sin salir de la vista de créditos */}
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleAbrirModalPago(estado)}
                    >
                      💵 Registrar Pago
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSeleccionarCliente(estado.clienteId)}
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

      {/* Modal de registro de pago */}
      {renderModalPago()}

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
