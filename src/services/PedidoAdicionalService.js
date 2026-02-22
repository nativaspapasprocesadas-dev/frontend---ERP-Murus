import { TIPOS_PEDIDO, ESTADOS_PEDIDO, METODOS_ENTREGA } from '@utils/constants'
import { getLocalDateTime } from '@utils/dateUtils'

/**
 * PedidoAdicionalService - Lógica de negocio para pedidos adicionales (fuera de ruta)
 *
 * Este servicio maneja las operaciones y validaciones específicas de pedidos adicionales,
 * siguiendo el principio de Single Responsibility (SOLID).
 *
 * REGLA PRINCIPAL: Los pedidos adicionales son ventas fuera del flujo de rutas estándar
 * que requieren comentario obligatorio y método de entrega.
 */
export class PedidoAdicionalService {
  /**
   * Valida que un pedido adicional tenga los datos requeridos
   *
   * @param {Object} pedidoData - Datos del pedido adicional
   * @returns {Object} { isValid: boolean, errors?: Object }
   */
  static validatePedidoAdicional(pedidoData) {
    const errors = {}

    // Validar cliente
    if (!pedidoData.clienteId) {
      errors.clienteId = 'El cliente es requerido'
    }

    // Validar productos
    if (!pedidoData.productos || pedidoData.productos.length === 0) {
      errors.productos = 'Debe agregar al menos un producto'
    }

    // Validar comentario (OBLIGATORIO para pedidos adicionales)
    if (!pedidoData.comentarioAdicional || pedidoData.comentarioAdicional.trim().length < 10) {
      errors.comentarioAdicional = 'El comentario es obligatorio (mínimo 10 caracteres)'
    }

    if (pedidoData.comentarioAdicional && pedidoData.comentarioAdicional.length > 500) {
      errors.comentarioAdicional = 'El comentario no puede exceder 500 caracteres'
    }

    // Validar método de entrega
    if (!pedidoData.metodoEntrega) {
      errors.metodoEntrega = 'El método de entrega es requerido'
    }

    // Validar fecha de entrega estimada
    if (!pedidoData.fechaEntregaEstimada) {
      errors.fechaEntregaEstimada = 'La fecha de entrega estimada es requerida'
    }

    // Validar tipo de pago
    if (!pedidoData.tipoPago) {
      errors.tipoPago = 'El tipo de pago es requerido'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  /**
   * Prepara los datos del pedido adicional para creación
   *
   * @param {Object} formData - Datos del formulario
   * @param {number} creadoPor - ID del usuario que crea el pedido
   * @returns {Object} Datos preparados
   */
  static preparePedidoAdicional(formData, creadoPor) {
    const ahora = getLocalDateTime()

    return {
      clienteId: formData.clienteId,
      fecha: ahora,
      estado: ESTADOS_PEDIDO.PENDIENTE, // Pedidos adicionales inician como pendientes
      rutaId: null, // No tiene ruta
      rutaNumero: null,
      totalKilos: formData.totalKilos || 0,
      totalMonto: formData.totalMonto || 0,
      tipoPago: formData.tipoPago,
      diasCredito: formData.tipoPago === 'credito' ? formData.diasCredito : null,
      fechaEntrega: null,
      creadoPor,
      fechaCreacion: ahora,
      // Campos específicos de pedido adicional
      tipoPedido: TIPOS_PEDIDO.ADICIONAL,
      esAdicional: true,
      comentarioAdicional: formData.comentarioAdicional.trim(),
      metodoEntrega: formData.metodoEntrega,
      fechaEntregaEstimada: formData.fechaEntregaEstimada,
      pagadoAnticipado: formData.pagadoAnticipado || false
    }
  }

  /**
   * Verifica si un pedido es adicional
   *
   * @param {Object} pedido - Pedido a verificar
   * @returns {boolean}
   */
  static isPedidoAdicional(pedido) {
    return pedido?.esAdicional === true || pedido?.tipoPedido === TIPOS_PEDIDO.ADICIONAL
  }

  /**
   * Obtiene el flujo de estados para pedidos adicionales
   *
   * @param {string} estadoActual - Estado actual del pedido
   * @returns {string|null} Siguiente estado o null si no hay
   */
  static getSiguienteEstadoAdicional(estadoActual) {
    const flujo = {
      [ESTADOS_PEDIDO.PENDIENTE]: ESTADOS_PEDIDO.COMPLETADO,
      [ESTADOS_PEDIDO.COMPLETADO]: null
    }
    return flujo[estadoActual] || null
  }

  /**
   * Obtiene el label del botón para el siguiente estado
   *
   * @param {string} estadoActual - Estado actual del pedido
   * @returns {string} Label del botón
   */
  static getBotonSiguienteEstadoAdicional(estadoActual) {
    const labels = {
      [ESTADOS_PEDIDO.PENDIENTE]: 'Marcar como Completado'
    }
    return labels[estadoActual] || 'Siguiente'
  }

  /**
   * Filtra solo pedidos adicionales
   *
   * @param {Array} pedidos - Lista de pedidos
   * @returns {Array} Solo pedidos adicionales
   */
  static filterPedidosAdicionales(pedidos) {
    if (!Array.isArray(pedidos)) return []

    return pedidos.filter(pedido => this.isPedidoAdicional(pedido))
  }

  /**
   * Filtra solo pedidos normales (de ruta)
   *
   * @param {Array} pedidos - Lista de pedidos
   * @returns {Array} Solo pedidos normales
   */
  static filterPedidosNormales(pedidos) {
    if (!Array.isArray(pedidos)) return []

    return pedidos.filter(pedido => !this.isPedidoAdicional(pedido))
  }

  /**
   * Obtiene estadísticas de pedidos adicionales
   *
   * @param {Array} pedidos - Lista de pedidos
   * @returns {Object} Estadísticas
   */
  static getEstadisticas(pedidos) {
    const adicionales = this.filterPedidosAdicionales(pedidos)

    return {
      total: adicionales.length,
      pendientes: adicionales.filter(p => p.estado === ESTADOS_PEDIDO.PENDIENTE).length,
      completados: adicionales.filter(p => p.estado === ESTADOS_PEDIDO.COMPLETADO).length,
      montoTotal: adicionales.reduce((sum, p) => sum + p.totalMonto, 0),
      porMetodo: this.groupByMetodoEntrega(adicionales)
    }
  }

  /**
   * Agrupa pedidos adicionales por método de entrega
   *
   * @param {Array} pedidosAdicionales - Pedidos adicionales
   * @returns {Object} Agrupación
   */
  static groupByMetodoEntrega(pedidosAdicionales) {
    const grouped = {}

    Object.keys(METODOS_ENTREGA).forEach(key => {
      const metodo = METODOS_ENTREGA[key]
      grouped[metodo] = pedidosAdicionales.filter(p => p.metodoEntrega === metodo).length
    })

    return grouped
  }

  /**
   * Valida que un comentario sea adecuado
   *
   * @param {string} comentario - Comentario a validar
   * @returns {Object} { isValid: boolean, error?: string }
   */
  static validateComentario(comentario) {
    if (!comentario || comentario.trim().length === 0) {
      return {
        isValid: false,
        error: 'El comentario es obligatorio para pedidos adicionales'
      }
    }

    if (comentario.trim().length < 10) {
      return {
        isValid: false,
        error: 'El comentario debe tener al menos 10 caracteres'
      }
    }

    if (comentario.length > 500) {
      return {
        isValid: false,
        error: 'El comentario no puede exceder 500 caracteres'
      }
    }

    return { isValid: true }
  }
}
