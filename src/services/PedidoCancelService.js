import { ESTADOS_PEDIDO } from '@utils/constants'

/**
 * PedidoCancelService
 *
 * Servicio que orquesta la cancelación de pedidos con sincronización entre módulos
 * Aplica principios SOLID:
 * - Single Responsibility: Solo maneja la lógica de cancelación
 * - Dependency Inversion: Recibe las dependencias (hooks) como parámetros
 */
export class PedidoCancelService {
  /**
   * Cancela un pedido y sincroniza con todos los módulos afectados
   *
   * @param {number} pedidoId - ID del pedido a cancelar
   * @param {Object} dependencies - Objeto con las dependencias necesarias
   * @param {Function} dependencies.updatePedido - Función para actualizar el pedido
   * @param {Function} dependencies.eliminarDeProduccion - Función para eliminar de producción
   * @param {Function} dependencies.eliminarDeRuta - Función para eliminar de ruta (opcional)
   * @param {Object} pedido - El objeto del pedido completo
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async cancelPedido(pedidoId, pedido, dependencies) {
    const {
      updatePedido,
      eliminarDeProduccion,
      eliminarDeRuta
    } = dependencies

    try {
      // Paso 1: Eliminar de producción (si tiene detalles)
      if (pedido.detalles && pedido.detalles.length > 0) {
        for (const detalle of pedido.detalles) {
          await eliminarDeProduccion(detalle.productoId, pedido.rutaNumero || 0)
        }
      }

      // Paso 2: Eliminar de ruta (si está asignado)
      if (pedido.estado === ESTADOS_PEDIDO.EN_PROCESO && pedido.rutaId && eliminarDeRuta) {
        await eliminarDeRuta(pedido.rutaId, pedidoId)
      }

      // Paso 3: Marcar el pedido como cancelado
      const result = await updatePedido(pedidoId, {
        estado: 'cancelado', // Nuevo estado
        fechaCancelacion: new Date().toISOString()
      })

      if (result.success) {
        return {
          success: true,
          message: 'Pedido cancelado exitosamente',
          affectedModules: this._getAffectedModulesCount(pedido)
        }
      } else {
        throw new Error(result.error || 'Error al cancelar el pedido')
      }
    } catch (error) {
      console.error('❌ Error al cancelar pedido:', error)
      return {
        success: false,
        error: error.message || 'Error inesperado al cancelar el pedido'
      }
    }
  }

  /**
   * Calcula cuántos módulos fueron afectados por la cancelación
   * @private
   */
  static _getAffectedModulesCount(pedido) {
    let count = 1 // El pedido en sí

    if (pedido.detalles && pedido.detalles.length > 0) {
      count++ // Producción
    }

    if (pedido.estado === ESTADOS_PEDIDO.EN_PROCESO && pedido.rutaId) {
      count++ // Rutas
    }

    return count
  }
}
