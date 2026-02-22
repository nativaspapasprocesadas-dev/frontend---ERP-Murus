import { ESTADOS_PEDIDO } from '@utils/constants'

/**
 * PedidoEditService
 *
 * Servicio que encapsula las reglas de negocio para editar y cancelar pedidos
 * Aplica principios SOLID:
 * - Single Responsibility: Solo maneja validaciones de edición/cancelación
 * - Open/Closed: Extensible mediante estrategias de validación
 * - Dependency Inversion: No depende de implementaciones específicas
 */
export class PedidoEditService {
  /**
   * Valida si un pedido puede ser editado
   * @param {Object} pedido - El pedido a validar
   * @returns {Object} { canEdit: boolean, reason: string }
   */
  static canEdit(pedido) {
    if (!pedido) {
      return { canEdit: false, reason: 'Pedido no encontrado' }
    }

    // Solo se pueden editar pedidos en preparación
    if (pedido.estado !== ESTADOS_PEDIDO.PENDIENTE) {
      return {
        canEdit: false,
        reason: `No se puede editar un pedido en estado "${pedido.estado}". Solo pedidos en preparación.`
      }
    }

    return { canEdit: true, reason: '' }
  }

  /**
   * Valida si un pedido puede ser cancelado
   * @param {Object} pedido - El pedido a validar
   * @returns {Object} { canCancel: boolean, reason: string, affectedModules: Array }
   */
  static canCancel(pedido) {
    if (!pedido) {
      return { canCancel: false, reason: 'Pedido no encontrado', affectedModules: [] }
    }

    // No se pueden cancelar pedidos ya cancelados
    if (pedido.estado === ESTADOS_PEDIDO.CANCELADO) {
      return {
        canCancel: false,
        reason: 'El pedido ya está cancelado.',
        affectedModules: []
      }
    }

    // No se pueden cancelar pedidos ya completados (porque afectan créditos)
    if (pedido.estado === ESTADOS_PEDIDO.COMPLETADO) {
      return {
        canCancel: false,
        reason: 'No se puede cancelar un pedido que ya fue completado. El pedido ya afectó los créditos del cliente.',
        affectedModules: ['creditos']
      }
    }

    // Determinar qué módulos se verán afectados
    const affectedModules = []

    if (pedido.estado === ESTADOS_PEDIDO.EN_PROCESO) {
      affectedModules.push('rutas')
    }

    // Siempre afecta producción si hay detalles
    if (pedido.detalles && pedido.detalles.length > 0) {
      affectedModules.push('produccion')
    }

    return {
      canCancel: true,
      reason: '',
      affectedModules
    }
  }

  /**
   * Genera un mensaje descriptivo de los módulos afectados
   * @param {Array} affectedModules - Lista de módulos afectados
   * @returns {string} Mensaje descriptivo
   */
  static getAffectedModulesMessage(affectedModules) {
    if (affectedModules.length === 0) {
      return ''
    }

    const messages = []
    if (affectedModules.includes('produccion')) {
      messages.push('Se eliminarán los productos de la lista de producción')
    }
    if (affectedModules.includes('rutas')) {
      messages.push('Se quitará el pedido de la ruta asignada')
    }
    if (affectedModules.includes('creditos')) {
      messages.push('Se revertirán los movimientos de crédito')
    }

    return messages.join('. ')
  }

  /**
   * Valida si se puede cambiar el estado de un pedido
   * @param {Object} pedido - El pedido a validar
   * @param {string} nuevoEstado - El nuevo estado
   * @returns {Object} { canChange: boolean, reason: string }
   */
  static canChangeState(pedido, nuevoEstado) {
    if (!pedido) {
      return { canChange: false, reason: 'Pedido no encontrado' }
    }

    const estadoActual = pedido.estado

    // Validar transiciones válidas
    const transicionesValidas = {
      [ESTADOS_PEDIDO.PENDIENTE]: [ESTADOS_PEDIDO.EN_PROCESO],
      [ESTADOS_PEDIDO.EN_PROCESO]: [ESTADOS_PEDIDO.COMPLETADO],
      [ESTADOS_PEDIDO.COMPLETADO]: [] // No se puede cambiar desde entregado
    }

    const estadosPermitidos = transicionesValidas[estadoActual] || []

    if (!estadosPermitidos.includes(nuevoEstado)) {
      return {
        canChange: false,
        reason: `No se puede cambiar de "${estadoActual}" a "${nuevoEstado}"`
      }
    }

    return { canChange: true, reason: '' }
  }
}
