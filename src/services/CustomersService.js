/**
 * CustomersService - Servicio para gestion de clientes
 *
 * APIs implementadas:
 * - API-016: GET /api/v1/customers (listar clientes)
 * - API-017: GET /api/v1/customers/:id (detalle cliente)
 * - API-018: POST /api/v1/customers (crear cliente)
 * - API-019: PUT /api/v1/customers/:id (actualizar cliente)
 * - API-020: PATCH /api/v1/customers/:id/type (cambiar tipo cliente)
 * - API-080: GET /api/v1/customers/:id/product-prices (obtener precios personalizados)
 * - API-081: PUT /api/v1/customers/:id/product-prices (actualizar precios personalizados)
 *
 * Segun documentacion: docs/integracion/04_apis_lista.md (lineas 1051-1387, 5021-5165)
 */
import apiClient from '@lib/api'

export class CustomersService {
  /**
   * API-016: Listar clientes
   * GET /api/v1/customers
   *
   * @param {Object} params - Parametros de consulta
   * @param {number} params.page - Numero de pagina (default: 1)
   * @param {number} params.pageSize - Tamaño de pagina (default: 20)
   * @param {string} params.search - Busqueda por nombre/email
   * @param {string} params.customerType - Filtro por tipo (RECURRENTE/NO_RECURRENTE)
   * @param {number} params.branchId - Filtro por sucursal
   * @returns {Promise<Object>} { success, data, pagination }
   */
  static async listCustomers(params = {}) {
    try {
      const response = await apiClient.get('/customers', { params })
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || {}
      }
    } catch (error) {
      console.error('Error en listCustomers:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Error al obtener lista de clientes',
        data: [],
        pagination: {}
      }
    }
  }

  /**
   * API-017: Obtener detalle de cliente
   * GET /api/v1/customers/:id
   *
   * @param {number} customerId - ID del cliente
   * @returns {Promise<Object>} { success, data }
   */
  static async getCustomerById(customerId) {
    try {
      const response = await apiClient.get(`/customers/${customerId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error en getCustomerById:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Error al obtener detalle del cliente',
        data: null
      }
    }
  }

  /**
   * GET /api/v1/customers/me
   * Obtener datos del cliente del usuario logueado (solo CLIENTE)
   *
   * @returns {Promise<Object>} { success, data }
   */
  static async getMyCustomer() {
    try {
      const response = await apiClient.get('/customers/me')
      return {
        success: true,
        data: response.data.data
      }
    } catch (error) {
      console.error('Error en getMyCustomer:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Error al obtener datos del cliente',
        data: null
      }
    }
  }

  /**
   * API-018: Crear nuevo cliente
   * POST /api/v1/customers
   *
   * @param {Object} customerData - Datos del cliente
   * @param {string} customerData.name - Nombre del negocio
   * @param {string} customerData.phone - Telefono
   * @param {string} customerData.password - Contraseña
   * @param {string} customerData.address - Direccion
   * @param {number} customerData.routeId - ID de ruta
   * @param {number} customerData.creditDays - Dias de credito
   * @param {number} customerData.discountPercentage - Descuento (opcional)
   * @returns {Promise<Object>} { success, data }
   */
  static async createCustomer(customerData) {
    try {
      const response = await apiClient.post('/customers', customerData)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error en createCustomer:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Error al crear cliente',
        data: null
      }
    }
  }

  /**
   * API-019: Actualizar cliente
   * PUT /api/v1/customers/:id
   *
   * @param {number} customerId - ID del cliente
   * @param {Object} customerData - Datos a actualizar
   * @returns {Promise<Object>} { success, data }
   */
  static async updateCustomer(customerId, customerData) {
    try {
      const response = await apiClient.put(`/customers/${customerId}`, customerData)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error en updateCustomer:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Error al actualizar cliente',
        data: null
      }
    }
  }

  /**
   * API-020: Cambiar tipo de cliente
   * PATCH /api/v1/customers/:id/type
   *
   * @param {number} customerId - ID del cliente
   * @param {string} customerType - Tipo (RECURRENTE/NO_RECURRENTE)
   * @returns {Promise<Object>} { success, data }
   */
  static async changeCustomerType(customerId, customerType) {
    try {
      const response = await apiClient.patch(`/customers/${customerId}/type`, {
        customerType
      })
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error en changeCustomerType:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Error al cambiar tipo de cliente',
        data: null
      }
    }
  }

  /**
   * Helper: Mapear datos del formulario frontend a formato API
   * Convierte los nombres de campos del frontend a los esperados por el backend
   *
   * @param {Object} formData - Datos del formulario
   * @returns {Object} Datos mapeados para API
   */
  static mapFormDataToAPI(formData) {
    return {
      name: formData.nombre,
      phone: formData.telefono,
      password: formData.password,
      address: formData.direccion,
      routeId: formData.ruta ? parseInt(formData.ruta) : null,
      creditDays: formData.diasCredito ? parseInt(formData.diasCredito) : 0,
      discountPercentage: formData.descuentoPorcentaje ? parseFloat(formData.descuentoPorcentaje) : 0,
      // Datos de contacto (si el backend los soporta en customers, sino iran en tabla separada)
      contactName: formData.nombreContacto,
      contactPosition: formData.cargoContacto,
      contactPhone: formData.telefonoContacto
    }
  }

  /**
   * Helper: Mapear datos de API a formato frontend
   * Convierte los nombres de campos del backend a los usados en el frontend
   *
   * @param {Object} apiData - Datos de la API
   * @returns {Object} Datos mapeados para frontend
   */
  static mapAPIToFrontend(apiData) {
    return {
      id: apiData.id,
      nombre: apiData.name || apiData.userName,
      email: apiData.email,
      telefono: apiData.phone,
      direccion: apiData.address,
      ruta: apiData.routeId,
      rutaLabel: apiData.routeName,
      diasCredito: apiData.creditDays || 0,
      descuentoPorcentaje: apiData.discountPercentage || 0,
      saldoActual: apiData.currentBalance || 0,
      tipoCliente: apiData.customerType,
      // Datos de contacto
      nombreContacto: apiData.contactName,
      cargoContacto: apiData.contactPosition,
      telefonoContacto: apiData.contactPhone,
      // Estado
      activo: apiData.isActive !== false,
      // Calculos derivados
      totalDeuda: apiData.currentBalance || 0,
      tieneDeudaVencida: apiData.hasOverdueDebt || false
    }
  }

  /**
   * Helper: Determinar tipo de cliente por dias de credito
   * Segun modelo de negocio: si diasCredito > 0 => RECURRENTE, sino NO_RECURRENTE
   *
   * @param {number} creditDays - Dias de credito
   * @returns {string} 'RECURRENTE' o 'NO_RECURRENTE'
   */
  static getCustomerType(creditDays) {
    return creditDays > 0 ? 'RECURRENTE' : 'NO_RECURRENTE'
  }

  /**
   * Helper: Validar si cliente es recurrente
   *
   * @param {number} creditDays - Dias de credito
   * @returns {boolean}
   */
  static isRecurringCustomer(creditDays) {
    return creditDays > 0
  }

  /**
   * API-080: Obtener precios personalizados de productos para un cliente
   * GET /api/v1/customers/:id/product-prices
   *
   * @param {number} customerId - ID del cliente
   * @returns {Promise<Object>} { success, data: [{ productId, productName, standardPrice, customPrice, isActive }] }
   */
  static async getCustomerProductPrices(customerId) {
    try {
      const response = await apiClient.get(`/customers/${customerId}/product-prices`)
      return {
        success: true,
        data: response.data.data || []
      }
    } catch (error) {
      console.error('Error en getCustomerProductPrices:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Error al obtener precios del cliente',
        data: []
      }
    }
  }

  /**
   * API-081: Actualizar precios personalizados de productos para un cliente
   * PUT /api/v1/customers/:id/product-prices
   *
   * @param {number} customerId - ID del cliente
   * @param {Array} prices - Array de precios [{ productId, customPrice, isActive }]
   * @returns {Promise<Object>} { success, data: { updated, created, removed, prices } }
   */
  static async updateCustomerProductPrices(customerId, prices) {
    try {
      const response = await apiClient.put(`/customers/${customerId}/product-prices`, {
        prices
      })
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error en updateCustomerProductPrices:', error)
      // Mostrar detalles del error del servidor
      console.error('Error details:', error.response?.data)
      return {
        success: false,
        error: error.response?.data?.error || 'Error al actualizar precios del cliente',
        details: error.response?.data?.details || [],
        data: null
      }
    }
  }

  /**
   * DELETE /api/v1/customers/:id
   * Eliminar cliente (soft delete)
   * El cliente y su usuario asociado se marcan como 'deleted'
   * Los pedidos y créditos existentes NO se afectan
   *
   * @param {number} customerId - ID del cliente a eliminar
   * @returns {Promise<Object>} { success, message, data }
   */
  static async deleteCustomer(customerId) {
    try {
      const response = await apiClient.delete(`/customers/${customerId}`)
      return {
        success: true,
        message: response.data.message,
        data: response.data.data
      }
    } catch (error) {
      console.error('Error en deleteCustomer:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Error al eliminar cliente',
        data: null
      }
    }
  }
}
