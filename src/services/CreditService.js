import { addDays, parseISO, format, isAfter, isBefore } from 'date-fns'
import api from '@lib/api'
import { getLocalDateTime } from '@utils/dateUtils'

/**
 * CreditService - Lógica de negocio relacionada con créditos
 *
 * Este servicio maneja las operaciones y validaciones de créditos,
 * siguiendo el principio de Single Responsibility (SOLID).
 *
 * REGLA PRINCIPAL: Los días de crédito del cliente (cliente.diasCredito)
 * son la FUENTE DE VERDAD para calcular fechas de vencimiento.
 */
export class CreditService {
  /**
   * API-022: Listar clientes con deuda
   * GET /api/v1/credits/debtors
   */
  static async getDebtors(params = {}) {
    try {
      const queryParams = new URLSearchParams()
      if (params.page) queryParams.append('page', params.page)
      if (params.pageSize) queryParams.append('pageSize', params.pageSize)
      if (params.branchId) queryParams.append('branchId', params.branchId)
      if (params.hasOverdue !== undefined) queryParams.append('hasOverdue', params.hasOverdue)

      const response = await api.get(`/credits/debtors?${queryParams.toString()}`)
      return response.data
    } catch (error) {
      console.error('Error obteniendo clientes con deuda:', error)
      throw new Error(error.response?.data?.error || 'Error al obtener clientes con deuda')
    }
  }

  /**
   * API-023: Obtener cuenta de cliente específico
   * GET /api/v1/credits/customers/{customerId}
   */
  static async getCustomerAccount(customerId, params = {}) {
    try {
      const queryParams = new URLSearchParams()
      if (params.page) queryParams.append('page', params.page)
      if (params.pageSize) queryParams.append('pageSize', params.pageSize)

      const response = await api.get(`/credits/customers/${customerId}?${queryParams.toString()}`)
      return response.data
    } catch (error) {
      console.error('Error obteniendo cuenta de cliente:', error)
      throw new Error(error.response?.data?.error || 'Error al obtener cuenta de cliente')
    }
  }

  /**
   * API-024: Enviar recordatorio de pago
   * POST /api/v1/credits/customers/{customerId}/reminder
   */
  static async sendPaymentReminder(customerId, message = null) {
    try {
      const payload = message ? { message } : {}
      const response = await api.post(`/credits/customers/${customerId}/reminder`, payload)
      return response.data
    } catch (error) {
      console.error('Error enviando recordatorio de pago:', error)
      throw new Error(error.response?.data?.error || 'Error al enviar recordatorio de pago')
    }
  }

  /**
   * API-021: Obtener cuenta del cliente autenticado
   * GET /api/v1/credits/account
   */
  static async getMyAccount(params = {}) {
    try {
      const queryParams = new URLSearchParams()
      if (params.page) queryParams.append('page', params.page)
      if (params.pageSize) queryParams.append('pageSize', params.pageSize)

      const response = await api.get(`/credits/account?${queryParams.toString()}`)
      return response.data
    } catch (error) {
      console.error('Error obteniendo mi estado de cuenta:', error)
      throw new Error(error.response?.data?.error || 'Error al obtener estado de cuenta')
    }
  }
  /**
   * Calcula la fecha de vencimiento basada en los días de crédito del cliente
   *
   * @param {Object} cliente - Cliente con diasCredito
   * @param {string|Date} fechaCreacion - Fecha de creación del crédito
   * @returns {Date} Fecha de vencimiento calculada
   */
  static calculateFechaVencimiento(cliente, fechaCreacion) {
    if (!cliente) {
      throw new Error('Cliente es requerido')
    }

    if (!cliente.diasCredito || cliente.diasCredito <= 0) {
      throw new Error('El cliente no tiene días de crédito configurados')
    }

    const fecha = typeof fechaCreacion === 'string'
      ? parseISO(fechaCreacion)
      : fechaCreacion

    return addDays(fecha, cliente.diasCredito)
  }

  /**
   * Formatea fecha de vencimiento a ISO string
   *
   * @param {Object} cliente - Cliente con diasCredito
   * @param {string|Date} fechaCreacion - Fecha de creación
   * @returns {string} Fecha de vencimiento en formato ISO
   */
  static calculateFechaVencimientoISO(cliente, fechaCreacion) {
    const fechaVencimiento = this.calculateFechaVencimiento(cliente, fechaCreacion)
    // Usar format de date-fns para evitar conversión a UTC
    return format(fechaVencimiento, "yyyy-MM-dd'T'HH:mm:ss")
  }

  /**
   * Crea datos de movimiento de crédito desde un pedido entregado
   *
   * @param {Object} pedido - Pedido entregado
   * @param {Object} cliente - Cliente del pedido
   * @param {number} monto - Monto del crédito
   * @returns {Object} Datos del movimiento de crédito
   */
  static createMovimientoFromPedido(pedido, cliente, monto) {
    const fechaCreacion = pedido.fechaEntrega || getLocalDateTime()
    const fechaVencimiento = this.calculateFechaVencimientoISO(cliente, fechaCreacion)

    return {
      clienteId: cliente.id,
      tipo: 'CARGO',
      monto,
      pedidoId: pedido.id,
      pagoId: null,
      metodoPago: null,
      referencia: `Pedido #${pedido.id}`,
      fechaMovimiento: fechaCreacion,
      fechaCreacion,
      fechaVencimiento,
      diasCredito: cliente.diasCredito,
      notas: `Pedido a crédito - ${cliente.diasCredito} días`
    }
  }

  /**
   * Valida que los días de crédito sean válidos
   *
   * @param {number} diasCredito - Días de crédito a validar
   * @returns {Object} { isValid: boolean, error?: string }
   */
  static validateDiasCredito(diasCredito) {
    if (!diasCredito || typeof diasCredito !== 'number') {
      return {
        isValid: false,
        error: 'Los días de crédito deben ser un número'
      }
    }

    if (diasCredito < 1) {
      return {
        isValid: false,
        error: 'Los días de crédito deben ser al menos 1 día'
      }
    }

    if (diasCredito > 365) {
      return {
        isValid: false,
        error: 'Los días de crédito no pueden exceder 365 días (1 año)'
      }
    }

    return { isValid: true }
  }

  /**
   * Verifica si un crédito está vencido
   *
   * @param {string|Date} fechaVencimiento - Fecha de vencimiento
   * @returns {boolean} True si está vencido
   */
  static isVencido(fechaVencimiento) {
    if (!fechaVencimiento) return false

    const fecha = typeof fechaVencimiento === 'string'
      ? parseISO(fechaVencimiento)
      : fechaVencimiento

    return isBefore(fecha, new Date())
  }

  /**
   * Verifica si un crédito está por vencer (próximos N días)
   *
   * @param {string|Date} fechaVencimiento - Fecha de vencimiento
   * @param {number} diasAnticipacion - Días de anticipación (default: 5)
   * @returns {boolean} True si está por vencer
   */
  static isPorVencer(fechaVencimiento, diasAnticipacion = 5) {
    if (!fechaVencimiento) return false

    const fecha = typeof fechaVencimiento === 'string'
      ? parseISO(fechaVencimiento)
      : fechaVencimiento

    const hoy = new Date()
    const fechaLimite = addDays(hoy, diasAnticipacion)

    return isAfter(fecha, hoy) && isBefore(fecha, fechaLimite)
  }

  /**
   * Calcula días hasta vencimiento (negativo si ya venció)
   *
   * @param {string|Date} fechaVencimiento - Fecha de vencimiento
   * @returns {number} Días hasta vencimiento
   */
  static diasHastaVencimiento(fechaVencimiento) {
    if (!fechaVencimiento) return null

    const fecha = typeof fechaVencimiento === 'string'
      ? parseISO(fechaVencimiento)
      : fechaVencimiento

    const hoy = new Date()
    const diferencia = fecha - hoy
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24))
  }

  /**
   * Obtiene el estado del crédito (PENDIENTE, VENCIDO, POR_VENCER)
   *
   * @param {string|Date} fechaVencimiento - Fecha de vencimiento
   * @param {number} saldo - Saldo pendiente
   * @returns {string} Estado del crédito
   */
  static getEstadoCredito(fechaVencimiento, saldo) {
    if (saldo <= 0) return 'PAGADO'

    if (this.isVencido(fechaVencimiento)) return 'VENCIDO'

    if (this.isPorVencer(fechaVencimiento)) return 'POR_VENCER'

    return 'PENDIENTE'
  }

  /**
   * Prepara datos de cliente con valores por defecto para crédito
   *
   * @param {Object} clienteData - Datos del cliente
   * @returns {Object} Datos preparados
   */
  static prepareClienteData(clienteData) {
    const prepared = { ...clienteData }

    // Valor por defecto: 15 días si no está especificado
    if (!prepared.diasCredito || prepared.diasCredito <= 0) {
      prepared.diasCredito = 15
    }

    return prepared
  }
}

