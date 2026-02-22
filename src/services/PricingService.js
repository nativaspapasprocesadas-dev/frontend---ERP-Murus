/**
 * PricingService
 *
 * Responsabilidad única: Gestionar la lógica de precios de productos para clientes
 * Principios SOLID aplicados:
 * - SRP: Solo maneja lógica de pricing
 * - OCP: Fácil extender con nuevas estrategias de pricing (bulk, seasonal, etc)
 * - DIP: No depende de implementaciones concretas de repositorio
 */
export class PricingService {
  /**
   * Valida que un precio sea válido
   * @param {number} precio - Precio a validar
   * @returns {boolean}
   */
  static isValidPrice(precio) {
    return precio !== null && precio !== undefined && precio >= 0
  }

  /**
   * Valida que un precio personalizado no sea menor que un porcentaje del precio base
   * @param {number} precioPersonalizado - Precio que quiere asignar el cliente
   * @param {number} precioBase - Precio base del producto
   * @param {number} porcentajeMinimo - Porcentaje mínimo permitido (default: 50%)
   * @returns {Object} { isValid: boolean, error?: string }
   */
  static validateCustomPrice(precioPersonalizado, precioBase, porcentajeMinimo = 50) {
    if (!this.isValidPrice(precioPersonalizado)) {
      return { isValid: false, error: 'Precio inválido' }
    }

    if (!this.isValidPrice(precioBase)) {
      return { isValid: false, error: 'Precio base inválido' }
    }

    const precioMinimo = precioBase * (porcentajeMinimo / 100)

    if (precioPersonalizado < precioMinimo) {
      return {
        isValid: false,
        error: `El precio debe ser al menos S/. ${precioMinimo.toFixed(2)} (${porcentajeMinimo}% del precio base)`
      }
    }

    return { isValid: true }
  }

  /**
   * Calcula el porcentaje de descuento basado en precio base y personalizado
   * @param {number} precioPersonalizado - Precio personalizado
   * @param {number} precioBase - Precio base
   * @returns {number} Porcentaje de descuento (ej: 12.5 para 12.5%)
   */
  static calculateDiscountPercentage(precioPersonalizado, precioBase) {
    if (!this.isValidPrice(precioPersonalizado) || !this.isValidPrice(precioBase) || precioBase === 0) {
      return 0
    }

    const descuento = ((precioBase - precioPersonalizado) / precioBase) * 100
    return Math.round(descuento * 100) / 100 // Redondear a 2 decimales
  }

  /**
   * Formatea precios de cliente para almacenamiento
   * @param {number} clienteId - ID del cliente
   * @param {Array} productosConPrecios - Array de {productoId, precio, activo}
   * @returns {Array} Array de precios formateados para guardar
   */
  static formatClientPrices(clienteId, productosConPrecios) {
    return productosConPrecios
      .filter(p => p.activo && this.isValidPrice(p.precio))
      .map(p => ({
        clienteId,
        productoId: p.productoId,
        precioPersonalizado: parseFloat(p.precio),
        fechaCreacion: new Date().toISOString()
      }))
  }

  /**
   * Inicializa precios por defecto para un cliente (precio base para todos los productos)
   * @param {Array} productos - Lista de productos disponibles
   * @returns {Array} Array de productos con precio base como precio personalizado
   */
  static initializeDefaultPrices(productos) {
    return productos.map(producto => {
      const precioBase = producto.precioBase || producto.precioKilo || producto.precioBaseKg || 0
      return {
        // Mantener todos los campos del producto original para que ProductPriceTable funcione
        ...producto,
        productoId: producto.id,
        id: producto.id, // Alias para compatibilidad con ProductPriceTable
        nombreProducto: this.buildProductName(producto),
        precioBase: precioBase,
        precioPersonalizado: precioBase,
        activo: false // Por defecto no está activo
      }
    })
  }

  /**
   * Construye el nombre completo del producto
   * @param {Object} producto - Objeto producto con nombre o especie, medida, presentacion
   * @returns {string} Nombre formateado
   */
  static buildProductName(producto) {
    // Si el producto ya tiene un nombre formateado, usarlo directamente
    if (producto.nombre && producto.nombre !== 'Producto sin nombre') {
      return producto.nombre
    }

    if (producto.nombreCompleto && producto.nombreCompleto !== 'Producto sin nombre') {
      return producto.nombreCompleto
    }

    // Fallback: construir desde especie/medida/presentación
    const parts = []

    if (producto.especie?.nombre || producto.nombreEspecie) {
      parts.push(producto.especie?.nombre || producto.nombreEspecie)
    }

    if (producto.medida?.nombre || producto.nombreMedida) {
      parts.push(producto.medida?.nombre || producto.nombreMedida)
    }

    if (producto.presentacion?.nombre || producto.nombrePresentacion) {
      parts.push(producto.presentacion?.nombre || producto.nombrePresentacion)
    } else if (producto.presentacion?.kilos || producto.presentacionKilos) {
      parts.push(`${producto.presentacion?.kilos || producto.presentacionKilos}kg`)
    }

    return parts.length > 0 ? parts.join(' - ') : 'Producto sin nombre'
  }

  /**
   * Aplica un descuento porcentual a todos los productos
   * @param {Array} productos - Array de productos con precioBase
   * @param {number} descuentoPorcentaje - Porcentaje de descuento (ej: 15 para 15%)
   * @returns {Array} Productos con precio personalizado aplicado
   */
  static applyGlobalDiscount(productos, descuentoPorcentaje) {
    if (descuentoPorcentaje < 0 || descuentoPorcentaje > 100) {
      console.warn('Descuento porcentual fuera de rango (0-100)')
      return productos
    }

    return productos.map(producto => ({
      ...producto,
      precioPersonalizado: producto.precioBase * (1 - descuentoPorcentaje / 100),
      activo: producto.activo || false
    }))
  }

  /**
   * Calcula el ahorro total para un cliente basado en sus precios personalizados
   * @param {Array} preciosCliente - Array de {precioBase, precioPersonalizado, cantidad}
   * @returns {Object} { ahorroTotal, porcentajePromedio }
   */
  static calculateTotalSavings(preciosCliente) {
    if (!preciosCliente || preciosCliente.length === 0) {
      return { ahorroTotal: 0, porcentajePromedio: 0 }
    }

    let ahorroTotal = 0
    let porcentajeSum = 0

    preciosCliente.forEach(item => {
      const ahorro = (item.precioBase - item.precioPersonalizado) * (item.cantidad || 1)
      ahorroTotal += ahorro
      porcentajeSum += this.calculateDiscountPercentage(item.precioPersonalizado, item.precioBase)
    })

    const porcentajePromedio = porcentajeSum / preciosCliente.length

    return {
      ahorroTotal: Math.round(ahorroTotal * 100) / 100,
      porcentajePromedio: Math.round(porcentajePromedio * 100) / 100
    }
  }
}
