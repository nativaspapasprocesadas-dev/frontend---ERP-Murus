/**
 * ProduccionService - Lógica de negocio para producción
 *
 * Este servicio maneja la integración automática entre pedidos y la pizarra de producción
 */

/**
 * Genera items de checklist de producción a partir de los detalles de un pedido
 *
 * @param {Object} pedido - Pedido completo con detalles
 * @param {Array} checklistActual - Checklist actual de producción
 * @returns {Array} Nuevos items a agregar al checklist
 */
export function generarChecklistDesdePedido(pedido, checklistActual = []) {
  if (!pedido.detalles || pedido.detalles.length === 0) {
    return []
  }

  const itemsNuevos = []

  // Agrupar productos del pedido por especie-medida-presentacion-ruta
  const agrupacion = {}

  pedido.detalles.forEach(detalle => {
    // Obtener IDs de especie, medida y presentación del producto
    const productoId = detalle.productoId
    const producto = detalle.producto || {}

    const especieId = producto.especieId
    const medidaId = producto.medidaId
    const presentacionId = producto.presentacionId
    const rutaId = pedido.rutaId

    // Clave única para agrupación
    const key = `${especieId}-${medidaId}-${presentacionId}-${rutaId}`

    if (!agrupacion[key]) {
      agrupacion[key] = {
        especieId,
        medidaId,
        presentacionId,
        rutaId,
        cantidad: 0
      }
    }

    agrupacion[key].cantidad += detalle.cantidad
  })

  // Convertir agrupación en items de checklist
  Object.values(agrupacion).forEach(grupo => {
    // Verificar si ya existe un item en el checklist para esta combinación
    const itemExistente = checklistActual.find(item =>
      item.especieId === grupo.especieId &&
      item.medidaId === grupo.medidaId &&
      item.presentacionId === grupo.presentacionId &&
      item.rutaId === grupo.rutaId
    )

    if (itemExistente) {
      // Si existe, actualizar la cantidad (se hará en el hook)
      itemsNuevos.push({
        ...itemExistente,
        cantidadTotal: itemExistente.cantidadTotal + grupo.cantidad,
        actualizar: true // Flag para indicar que es actualización
      })
    } else {
      // Si no existe, crear nuevo item
      itemsNuevos.push({
        rutaId: grupo.rutaId,
        especieId: grupo.especieId,
        medidaId: grupo.medidaId,
        presentacionId: grupo.presentacionId,
        cantidadTotal: grupo.cantidad,
        cantidadCompletada: 0,
        completado: false,
        fechaCreacion: new Date().toISOString(),
        actualizar: false // Flag para indicar que es nuevo
      })
    }
  })

  return itemsNuevos
}
