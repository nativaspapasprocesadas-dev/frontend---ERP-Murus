/**
 * ProductService - Lógica de negocio relacionada con productos
 *
 * Este servicio maneja las operaciones y validaciones de productos,
 * siguiendo el principio de Single Responsibility (SOLID).
 * La lógica compleja de negocio debe estar aquí, no en componentes.
 */
export class ProductService {
  /**
   * Valida si un producto es válido para mostrar en catálogo
   * @param {Object} producto - Producto a validar
   * @returns {boolean}
   */
  static canShowInCatalog(producto) {
    if (!producto) return false

    return (
      producto.activo === true &&
      producto.mostrarEnCatalogo === true &&
      producto.precioBaseKg > 0
    )
  }

  /**
   * Filtra productos que deben mostrarse en el catálogo
   * @param {Array} productos - Lista de productos
   * @returns {Array} Productos visibles en catálogo
   */
  static filterCatalogProducts(productos) {
    if (!Array.isArray(productos)) return []

    return productos.filter(producto => this.canShowInCatalog(producto))
  }

  /**
   * Valida si un producto puede cambiar su estado de visibilidad en catálogo
   * @param {Object} producto - Producto a validar
   * @returns {Object} { isValid: boolean, error?: string }
   */
  static validateCatalogVisibilityChange(producto) {
    if (!producto) {
      return { isValid: false, error: 'Producto no encontrado' }
    }

    if (!producto.activo) {
      return {
        isValid: false,
        error: 'No se puede mostrar en catálogo un producto inactivo'
      }
    }

    if (!producto.precioBaseKg || producto.precioBaseKg <= 0) {
      return {
        isValid: false,
        error: 'El producto debe tener un precio base válido'
      }
    }

    return { isValid: true }
  }

  /**
   * Prepara los datos del producto para actualización
   * @param {Object} productoData - Datos del producto
   * @returns {Object} Datos validados y formateados
   */
  static prepareProductData(productoData) {
    const prepared = { ...productoData }

    // Si se desactiva el producto, automáticamente se oculta del catálogo
    if (prepared.activo === false) {
      prepared.mostrarEnCatalogo = false
    }

    // Valor por defecto para mostrarEnCatalogo
    if (prepared.mostrarEnCatalogo === undefined) {
      prepared.mostrarEnCatalogo = true
    }

    return prepared
  }

  /**
   * Cuenta productos visibles en catálogo
   * @param {Array} productos - Lista de productos
   * @returns {number} Cantidad de productos visibles
   */
  static countCatalogProducts(productos) {
    return this.filterCatalogProducts(productos).length
  }

  /**
   * Obtiene estadísticas de visibilidad de productos
   * @param {Array} productos - Lista de productos
   * @returns {Object} Estadísticas
   */
  static getCatalogStats(productos) {
    if (!Array.isArray(productos)) {
      return {
        total: 0,
        visiblesEnCatalogo: 0,
        ocultosEnCatalogo: 0,
        inactivos: 0
      }
    }

    const activos = productos.filter(p => p.activo)
    const inactivos = productos.filter(p => !p.activo)
    const visibles = this.filterCatalogProducts(productos)
    const ocultos = activos.filter(p => !p.mostrarEnCatalogo)

    return {
      total: productos.length,
      visiblesEnCatalogo: visibles.length,
      ocultosEnCatalogo: ocultos.length,
      inactivos: inactivos.length
    }
  }
}

