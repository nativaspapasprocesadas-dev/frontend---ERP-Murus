import { useState } from 'react'
import { parseISO } from 'date-fns'
import { toast } from 'react-toastify'
import { createOrder, uploadVoucher } from '@services/OrdersService'
import { TIPOS_PAGO, TIPOS_PAGO_LABELS, ROLES, TIPO_CLIENTE } from '@utils/constants'
import { formatearFecha, formatearMoneda } from '@utils/formatters'

/**
 * Hook para creación de pedidos
 *
 * INTEGRACIÓN:
 * - API-009: POST /api/v1/orders (crear pedido)
 * - API-018: POST /api/v1/customers (crear cliente si es nuevo)
 * Backend: ordersController.js, ordersModel.js
 *
 * LOGICA DE VOUCHER:
 * - Cliente NO_RECURRENTE + CONTADO: Voucher OBLIGATORIO
 * - Cliente RECURRENTE + CONTADO: Voucher OPCIONAL (para demostrar pago anticipado)
 * - Cliente RECURRENTE + CREDITO: Sin voucher
 *
 * @param {Object} params
 * @param {Object} params.cliente - Cliente del pedido
 * @param {Array} params.carrito - Items del carrito
 * @param {Object} params.totales - Totales calculados
 * @param {Object} params.paymentForm - Estado del formulario de pago
 * @param {Object} params.deliveryForm - Estado del formulario de entrega
 * @param {Object} params.user - Usuario autenticado
 * @param {Function} params.isRole - Función para verificar rol
 * @param {Function} params.createCliente - Función para crear cliente
 * @param {Function} params.showToast - Función para mostrar notificaciones
 * @param {Function} params.onSuccess - Callback de éxito
 * @param {File} params.voucherFile - Archivo de voucher (obligatorio para NO_RECURRENTE, opcional para RECURRENTE con CONTADO)
 * @param {Object} params.creditConfig - Configuración de crédito para alertas
 * @returns {Object} Estado y función de creación
 */
export const usePedidoCreation = ({
  cliente,
  carrito,
  totales,
  paymentForm,
  deliveryForm,
  user,
  isRole,
  createCliente,
  showToast,
  onSuccess,
  voucherFile,
  creditConfig
}) => {
  const [loading, setLoading] = useState(false)

  const crearPedido = async () => {
    // Validaciones
    if (carrito.length === 0) {
      showToast('El carrito está vacío', 'warning')
      return false
    }

    if (!cliente) {
      showToast('No se encontró información del cliente', 'error')
      return false
    }

    // Validar que el cliente tenga ID (importante para rol CLIENTE)
    if (!cliente.id && !cliente.esNuevo) {
      showToast('Error: No se pudo obtener información del cliente. Intenta recargar la página.', 'error')
      console.error('[usePedidoCreation] Cliente sin ID:', cliente)
      return false
    }

    // Validar método de entrega
    if (!deliveryForm.isMetodoEntregaValido()) {
      showToast('Debes especificar el método de entrega', 'warning')
      return false
    }

    // Determinar si voucher es obligatorio u opcional
    const esClienteNoRecurrente = cliente.tipoCliente === TIPO_CLIENTE.NO_RECURRENTE
    const esPagoContado = paymentForm.tipoPagoSeleccionado === TIPOS_PAGO.CONTADO

    // Voucher obligatorio solo para cliente NO_RECURRENTE
    if (esClienteNoRecurrente && !voucherFile) {
      showToast('Debes adjuntar el voucher de pago', 'warning')
      return false
    }

    setLoading(true)

    try {
      let clienteId = cliente.id

      // Si es un cliente nuevo, crearlo primero
      if (cliente.esNuevo) {
        const nuevoClienteData = {
          nombre: cliente.nombre,
          email: cliente.email || `${cliente.nombre.toLowerCase().replace(/\s+/g, '')}@temp.com`,
          telefono: cliente.telefono,
          password: 'temporal123',
          direccion: cliente.direccion,
          ruta: cliente.ruta || 1,
          diasCredito: 15
        }

        const resultCliente = await createCliente(nuevoClienteData)

        if (!resultCliente.success) {
          showToast('Error al registrar el cliente nuevo', 'error')
          setLoading(false)
          return false
        }

        clienteId = resultCliente.data.id
        showToast(`Cliente "${cliente.nombre}" registrado exitosamente`, 'success', 3000)
      }

      // Obtener días de crédito finales
      const diasCreditoFinal = paymentForm.getDiasCreditoFinal()

      // Mapear items del carrito al formato de la API
      // unitPrice = precio por unidad/presentación = precioKg × kilosPorBolsa
      const items = carrito.map((item) => ({
        productId: item.productoId,
        quantity: item.cantidad,
        unitPrice: item.precioKg * item.kilosPorBolsa
      }))

      // Preparar datos del pedido según API-009
      // Fecha de entrega: calculada según método de entrega seleccionado
      // - Si es 'agendar_manana' → mañana
      // - En cualquier otro caso → hoy
      const fechaEntrega = deliveryForm.getFechaEntrega()

      const orderData = {
        customerId: clienteId,
        paymentType: paymentForm.tipoPagoSeleccionado,
        creditDays: diasCreditoFinal || null,
        deliveryMethod: deliveryForm.getMetodoEntregaFinal(),
        observations: deliveryForm.observaciones || '',
        isPrepaid: paymentForm.pagadoAnticipado || false,
        estimatedDeliveryDate: fechaEntrega,
        assignRoute: deliveryForm.debeAsignarRuta(), // Solo asignar ruta si es "Delivery Propio" o "Agendar para mañana"
        items: items
      }

      // Crear pedido usando API real
      const resultadoPedido = await createOrder(orderData)

      if (!resultadoPedido.success) {
        throw new Error(resultadoPedido.error || 'Error al crear el pedido')
      }

      const pedidoCreado = resultadoPedido.data

      // Subir voucher si hay archivo (obligatorio para NO_RECURRENTE, opcional para RECURRENTE con CONTADO)
      if (voucherFile) {
        try {
          const voucherResult = await uploadVoucher(pedidoCreado.id, voucherFile)
          console.log('Voucher subido exitosamente:', voucherResult)
          showToast('Voucher adjuntado correctamente. Pendiente de aprobacion.', 'info', 3000)
        } catch (voucherError) {
          console.error('Error al subir voucher:', voucherError)
          showToast('Pedido creado pero hubo un error al subir el voucher', 'warning', 5000)
        }
      }

      // Construir mensaje de éxito
      let mensajeExito = (isRole(ROLES.ADMINISTRADOR) || isRole(ROLES.COORDINADOR))
        ? `✅ Pedido creado exitosamente para ${cliente.nombre}\n\n💰 Tipo de pago: ${TIPOS_PAGO_LABELS[paymentForm.tipoPagoSeleccionado]}`
        : `✅ Pedido creado exitosamente\n\n💰 Tipo de pago: ${TIPOS_PAGO_LABELS[paymentForm.tipoPagoSeleccionado]}`

      // Agregar información de entrega programada para mañana
      // Caso 1: Usuario seleccionó manualmente "Agendar para mañana"
      // Caso 2: Backend agendó automáticamente porque pasó el horario límite
      if (pedidoCreado.agendadoParaManana) {
        // Agendado automáticamente por el backend (pasó horario límite)
        const fechaEntrega = pedidoCreado.fechaEntrega
          ? parseISO(pedidoCreado.fechaEntrega)
          : new Date()
        const fechaFormateada = fechaEntrega.toLocaleDateString('es-PE', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        })
        mensajeExito += `\n📅 Agendado para: ${fechaFormateada} (horario de ruta superado)`
      } else if (deliveryForm.esPedidoAgendado && deliveryForm.esPedidoAgendado()) {
        const fechaManana = new Date()
        fechaManana.setDate(fechaManana.getDate() + 1)
        const fechaFormateada = fechaManana.toLocaleDateString('es-PE', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        })
        mensajeExito += `\n📅 Agendado para: ${fechaFormateada}`
      }

      if (paymentForm.tipoPagoSeleccionado === TIPOS_PAGO.CREDITO && diasCreditoFinal) {
        const fechaVencimiento = new Date()
        fechaVencimiento.setDate(fechaVencimiento.getDate() + diasCreditoFinal)
        mensajeExito += `\n⏰ Días de crédito: ${diasCreditoFinal} días\n📅 Vence: ${formatearFecha(fechaVencimiento, 'dd/MM/yyyy')}`
      }

      showToast(mensajeExito, 'success', 5000)

      // Verificar si el pedido a crédito hace que el cliente exceda el monto de alerta configurado
      const montoAlertaCredito = creditConfig?.montoAltoGlobal || 0
      const esPedidoCredito = paymentForm.tipoPagoSeleccionado === TIPOS_PAGO.CREDITO

      if (esPedidoCredito && montoAlertaCredito > 0) {
        // Calcular el nuevo saldo aproximado del cliente (saldo actual + monto del pedido)
        const saldoActual = cliente?.totalDeuda || cliente?.saldoActual || 0
        const nuevoSaldoAproximado = saldoActual + (totales?.total || 0)

        if (nuevoSaldoAproximado >= montoAlertaCredito) {
          // Mostrar toast de advertencia después de un pequeño delay para no interferir con el toast de éxito
          setTimeout(() => {
            toast.warning(
              `Alerta de Crédito: El cliente "${cliente.nombre}" ahora tiene un saldo aproximado de ${formatearMoneda(nuevoSaldoAproximado)}, que excede el monto de alerta configurado (${formatearMoneda(montoAlertaCredito)})`,
              {
                position: 'top-right',
                autoClose: 10000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true
              }
            )
          }, 1500)
        }
      }

      onSuccess?.()

      return true
    } catch (error) {
      console.error('Error al crear pedido:', error)
      showToast('Error al crear el pedido', 'error')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    crearPedido,
    loading
  }
}
