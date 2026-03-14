/**
 * OrdersService - Servicio para consumir APIs de pedidos
 * Implementa:
 * - API-006: GET /api/v1/orders (listar pedidos)
 * - API-007: GET /api/v1/orders/stats (estadisticas de pedidos)
 * - API-008: GET /api/v1/orders/:id (obtener detalle de pedido)
 * - API-009: POST /api/v1/orders (crear nuevo pedido)
 * - API-010: PUT /api/v1/orders/:id (actualizar pedido)
 * - API-012: POST /api/v1/orders/:id/assign-route (asignar ruta)
 * - API-013: POST /api/v1/orders/:id/deliver (marcar como entregado)
 * Segun definicion en 04_apis_lista.md
 */

import apiClient from '@/lib/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4020/api/v1'

/**
 * Obtener detalle completo de un pedido
 * API-008 GET /api/v1/orders/:id
 * @param {number|string} orderId - ID del pedido
 * @returns {Promise<Object>} Detalle completo del pedido
 */
export const getOrderById = async (orderId) => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Pedido no encontrado');
      }
      if (response.status === 401) {
        throw new Error('No autorizado');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Error obteniendo detalle del pedido');
    }

    // Mapeo de campos API -> Frontend
    // El backend devuelve customer como objeto anidado
    return {
      id: data.id,
      correlativoSede: data.correlativoSede,
      branchId: data.branchId,
      branchCode: data.branchCode,
      numero: data.orderNumber,
      fecha: data.createdAt,
      estado: data.status,
      tipoPedido: data.tipoPedido || 'normal',
      tipoDespacho: data.tipoDespacho || 'RUTA',
      tipoPago: data.tipoPago || (data.tipoPedido === 'adicional' ? 'credito' : 'contado'),
      total: data.total,
      subtotal: data.subtotal,
      observaciones: data.observations,

      // Informacion del cliente (puede venir como objeto o plano)
      customerId: data.customer?.id || data.customerId,
      nombreCliente: data.customer?.name || data.customerName,
      emailCliente: data.customer?.email || data.customerEmail,
      direccionCliente: data.customer?.address || data.customerAddress,
      telefonoCliente: data.customer?.contactPhone || data.customerContactPhone,
      contactoCliente: data.customer?.contactName,
      tipoCliente: data.customer?.customerType,

      // Items del pedido con información completa
      detalles: data.items ? data.items.map(item => ({
        id: item.id,
        productoId: item.productId,
        nombreProducto: item.productName,
        codigoProducto: item.productCode,
        imagenUrl: item.imagenUrl || null,
        cantidad: item.quantity,
        precioUnitario: item.unitPrice,
        subtotal: item.subtotal,
        kilosPorBolsa: item.kilosPorBolsa || 0,
        totalKilos: item.totalKilos || 0,
        especieNombre: item.especieNombre || null,
        medidaNombre: item.medidaNombre || null,
        presentacionNombre: item.presentacionNombre || null
      })) : [],

      // Total de kilos del pedido
      totalKilos: data.totalKilos || 0,

      // Informacion de ruta (si existe)
      rutaDiariaId: data.route?.id || data.rutaDiariaId,
      rutaNombre: data.route?.name || data.rutaNombre,

      // Informacion de voucher y pago
      voucherUrl: data.voucherUrl || null,
      estadoPago: data.estadoPago || null,
      pagadoAnticipado: data.pagoAnticipado || false
    };

  } catch (error) {
    console.error('[OrdersService] Error en getOrderById:', error);
    throw error;
  }
};

/**
 * Crear nuevo pedido
 * API-009 POST /api/v1/orders
 * @param {Object} orderData - Datos del pedido
 * @param {string} orderData.customerId - ID del cliente
 * @param {string} orderData.paymentType - CONTADO | CREDITO
 * @param {string} orderData.deliveryMethod - DELIVERY | RECOJO
 * @param {number} orderData.creditDays - Dias de credito (si aplica)
 * @param {string} orderData.observations - Observaciones
 * @param {Array} orderData.items - Items del pedido [{productId, quantity, unitPrice}]
 * @param {boolean} orderData.isPrepaid - Pago anticipado
 * @param {string} orderData.orderType - NORMAL | ADICIONAL (agregado ELM-032)
 * @param {string} orderData.estimatedDeliveryDate - Fecha entrega estimada ISO8601 (agregado ELM-032)
 * @param {boolean} orderData.assignRoute - Si debe asignar ruta automaticamente (solo para Delivery Propio)
 * @returns {Promise<Object>} Pedido creado
 */
export const createOrder = async (orderData) => {
  try {
    // Log para depuración
    console.log('[OrdersService] Creando pedido con datos:', {
      customerId: orderData.customerId,
      paymentType: orderData.paymentType,
      deliveryMethod: orderData.deliveryMethod,
      itemsCount: orderData.items?.length
    })

    const response = await apiClient.post('/orders', {
      customerId: orderData.customerId,
      paymentType: orderData.paymentType || 'CONTADO',
      creditDays: orderData.creditDays || null,
      deliveryMethod: orderData.deliveryMethod,
      estimatedDeliveryDate: orderData.estimatedDeliveryDate || null,
      observations: orderData.observations || '',
      isPrepaid: orderData.isPrepaid || false,
      orderType: orderData.orderType || 'NORMAL', // ELM-032: tipo_pedido
      assignRoute: orderData.assignRoute || false, // Solo asignar ruta si es Delivery Propio
      tipoDespacho: orderData.tipoDespacho || 'RUTA', // Tipo de despacho: RUTA, TAXI, RECOJO, OTRO
      items: orderData.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    })

    console.log('[OrdersService] Pedido creado exitosamente:', response.data)

    return {
      success: true,
      data: response.data,
      message: 'Pedido creado exitosamente'
    }
  } catch (error) {
    console.error('[OrdersService] Error en createOrder:', error)
    console.error('[OrdersService] Response data:', error.response?.data)
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error al crear el pedido'
    }
  }
}

/**
 * Listar pedidos con filtros y paginacion
 * API-006 GET /api/v1/orders
 * @param {Object} filters - Filtros de busqueda
 * @param {number} filters.page - Pagina actual
 * @param {number} filters.pageSize - Cantidad por pagina
 * @param {string} filters.status - Estado del pedido (PENDIENTE|EN_PROCESO|COMPLETADO|CANCELADO)
 * @param {number} filters.customerId - ID del cliente
 * @param {number} filters.branchId - ID de la sede
 * @param {string} filters.dateFrom - Fecha desde (YYYY-MM-DD)
 * @param {string} filters.dateTo - Fecha hasta (YYYY-MM-DD)
 * @returns {Promise<Object>} Lista paginada de pedidos
 */
export const listOrders = async (filters = {}) => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No autenticado');
    }

    const queryParams = new URLSearchParams();
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.pageSize !== undefined && filters.pageSize !== null) queryParams.append('pageSize', filters.pageSize);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.customerId) queryParams.append('customerId', filters.customerId);
    if (filters.branchId) queryParams.append('branchId', filters.branchId);
    if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
    if (filters.search) queryParams.append('search', filters.search);

    const response = await fetch(`${API_BASE_URL}/orders?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('No autorizado');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Error listando pedidos');
    }

    // Mapeo de campos API -> Frontend
    // Segun campos del backend actualizados en ordersModel.js
    return {
      pedidos: data.data.map(order => {
        // Determinar tipo de pago: usar el de DB, o inferir de customerType, o fallback
        let tipoPagoFinal = order.tipoPago
        if (!tipoPagoFinal) {
          // Fallback basado en tipo de cliente
          if (order.customerType === 'RECURRENTE') {
            tipoPagoFinal = 'CREDITO'
          } else if (order.customerType === 'NO_RECURRENTE') {
            tipoPagoFinal = 'CONTADO'
          } else {
            tipoPagoFinal = 'CONTADO'
          }
        }

        return {
          id: order.id,
          correlativoSede: order.correlativoSede,
          branchCode: order.branchCode,
          numero: order.orderNumber,
          fecha: order.createdAt,
          estado: order.status,
          tipoPedido: order.tipoPedido || 'normal',
          tipoPago: tipoPagoFinal.toUpperCase(),
          tipoDespacho: order.tipoDespacho || 'RUTA',
          total: order.total,
          subtotal: order.subtotal,
          customerId: order.customerId,
          nombreCliente: order.customerName,
          emailCliente: order.customerEmail,
          tipoCliente: order.customerType,
          branchId: order.branchId,
          rutaDiariaId: order.rutaDiariaId,
          rutaNombre: order.rutaNombre,
          observaciones: order.observations,
          comentarioAdicional: order.observations, // Para mostrar en tabla
          // Campos para compatibilidad con frontend actual
          sedeId: order.branchId,
          clienteId: order.customerId,
          totalMonto: order.total,
          totalKilos: order.totalKilos || 0,
          cantidadProductos: order.itemsCount || 0,
          // Campos para gestion de vouchers y pagos
          voucherUrl: order.voucherUrl || null,
          estadoPago: order.estadoPago || null,
          pagoAnticipado: order.pagoAnticipado || false
        }
      }),
      pagination: data.pagination
    };

  } catch (error) {
    console.error('[OrdersService] Error en listOrders:', error);
    throw error;
  }
};

/**
 * Obtener estadisticas de pedidos
 * API-007 GET /api/v1/orders/stats
 * @param {Object} filters - Filtros
 * @param {number} filters.branchId - ID de la sede
 * @param {string} filters.date - Fecha (YYYY-MM-DD)
 * @returns {Promise<Object>} Estadisticas de pedidos
 */
export const getOrdersStats = async (filters = {}) => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No autenticado');
    }

    const queryParams = new URLSearchParams();
    if (filters.branchId) queryParams.append('branchId', filters.branchId);
    if (filters.date) queryParams.append('date', filters.date);

    const response = await fetch(`${API_BASE_URL}/orders/stats?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('No autorizado');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Error obteniendo estadisticas');
    }

    // Mapeo de campos API -> Frontend
    return {
      total: data.total || 0,
      pendientes: data.pendientes || 0,
      enProceso: data.enProceso || 0,
      completados: data.completados || 0,
      cancelados: data.cancelados || 0,
      despachoRuta: data.despachoRuta || 0,
      despachoTaxi: data.despachoTaxi || 0,
      despachoRecojo: data.despachoRecojo || 0,
      despachoOtro: data.despachoOtro || 0
    };

  } catch (error) {
    console.error('[OrdersService] Error en getOrdersStats:', error);
    throw error;
  }
};

/**
 * Actualizar pedido existente
 * API-010 PUT /api/v1/orders/:id
 * @param {number} orderId - ID del pedido
 * @param {Object} updateData - Datos a actualizar
 * @param {Array} updateData.items - Items actualizados [{id, quantity, deleted}]
 * @returns {Promise<Object>} Pedido actualizado
 */
export const updateOrder = async (orderId, updateData) => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        items: updateData.items || []
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('No autorizado');
      }
      if (response.status === 404) {
        throw new Error('Pedido no encontrado');
      }
      if (response.status === 409) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'El pedido no puede ser editado en su estado actual');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Error actualizando pedido');
    }

    return {
      id: data.id,
      total: data.total,
      items: data.items
    };

  } catch (error) {
    console.error('[OrdersService] Error en updateOrder:', error);
    throw error;
  }
};

/**
 * Asignar pedido a una ruta
 * API-012 POST /api/v1/orders/:id/assign-route
 * @param {number} orderId - ID del pedido
 * @param {number} routeId - ID de la ruta diaria
 * @returns {Promise<Object>} Pedido con ruta asignada
 */
export const assignOrderToRoute = async (orderId, routeId) => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/assign-route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        routeId: routeId
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('No autorizado');
      }
      if (response.status === 404) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Pedido o ruta no encontrada');
      }
      if (response.status === 409) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'El pedido no puede ser asignado');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Error asignando pedido a ruta');
    }

    return {
      id: data.id,
      routeId: data.routeId,
      route: data.route
    };

  } catch (error) {
    console.error('[OrdersService] Error en assignOrderToRoute:', error);
    throw error;
  }
};

/**
 * Cancelar pedido
 * API-011 POST /api/v1/orders/:id/cancel
 * @param {number} orderId - ID del pedido
 * @param {string} reason - Razon de cancelacion (opcional)
 * @returns {Promise<Object>} Pedido cancelado
 */
export const cancelOrder = async (orderId, reason = '') => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        reason: reason
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('No autorizado');
      }
      if (response.status === 404) {
        throw new Error('Pedido no encontrado');
      }
      if (response.status === 409) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'El pedido no puede ser cancelado en su estado actual');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Error cancelando pedido');
    }

    return {
      id: data.id,
      status: data.status,
      cancelledAt: data.cancelledAt
    };

  } catch (error) {
    console.error('[OrdersService] Error en cancelOrder:', error);
    throw error;
  }
};

/**
 * Marcar pedido como entregado (cerrar venta)
 * API-013 POST /api/v1/orders/:id/deliver
 * @param {number} orderId - ID del pedido
 * @param {Object} deliveryData - Datos de entrega
 * @param {string} deliveryData.paymentType - CONTADO|CREDITO|MIXTO
 * @param {number} deliveryData.cashAmount - Monto en efectivo
 * @param {number} deliveryData.creditAmount - Monto a credito
 * @param {number} deliveryData.creditDays - Dias de credito
 * @param {boolean} deliveryData.acceptExceedLimit - Aceptar exceder limite de credito
 * @returns {Promise<Object>} Pedido entregado
 */
export const deliverOrder = async (orderId, deliveryData) => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/deliver`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        paymentType: deliveryData.paymentType,
        cashAmount: deliveryData.cashAmount || 0,
        creditAmount: deliveryData.creditAmount || 0,
        creditDays: deliveryData.creditDays || 0,
        acceptExceedLimit: deliveryData.acceptExceedLimit || false
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('No autorizado');
      }
      if (response.status === 404) {
        throw new Error('Pedido no encontrado');
      }
      if (response.status === 409) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'El pedido no puede ser entregado');
      }
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Datos de pago invalidos');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Error marcando pedido como entregado');
    }

    return {
      id: data.id,
      status: data.status,
      deliveredAt: data.deliveredAt,
      creditMovementId: data.creditMovementId
    };

  } catch (error) {
    console.error('[OrdersService] Error en deliverOrder:', error);
    throw error;
  }
};

/**
 * Subir voucher de pago para un pedido
 * POST /api/v1/orders/:id/voucher
 * @param {number} orderId - ID del pedido
 * @param {File} file - Archivo del voucher (imagen o PDF)
 * @returns {Promise<Object>} Pedido con voucher adjunto
 */
export const uploadVoucher = async (orderId, file) => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No autenticado');
    }

    const formData = new FormData();
    formData.append('voucher', file);

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/voucher`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('No autorizado');
      }
      if (response.status === 404) {
        throw new Error('Pedido no encontrado');
      }
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Archivo invalido');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Error subiendo voucher');
    }

    return {
      id: data.id,
      voucherUrl: data.voucherUrl,
      estadoPago: data.estadoPago
    };

  } catch (error) {
    console.error('[OrdersService] Error en uploadVoucher:', error);
    throw error;
  }
};

/**
 * Aprobar o rechazar pago de un pedido
 * PATCH /api/v1/orders/:id/approve-payment
 * @param {number} orderId - ID del pedido
 * @param {string} status - Estado: 'APROBADO' | 'RECHAZADO' | 'PENDIENTE'
 * @param {string} observaciones - Observaciones (obligatorio si se rechaza)
 * @returns {Promise<Object>} Pedido con estado de pago actualizado
 */
export const approvePayment = async (orderId, status, observaciones = '') => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/approve-payment`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status,
        observaciones
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('No autorizado');
      }
      if (response.status === 403) {
        throw new Error('No tienes permisos para aprobar pagos');
      }
      if (response.status === 404) {
        throw new Error('Pedido no encontrado');
      }
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Solicitud invalida');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Error procesando aprobacion de pago');
    }

    return {
      success: true,
      id: data.id,
      estadoPago: data.estadoPago,
      message: data.message
    };

  } catch (error) {
    console.error('[OrdersService] Error en approvePayment:', error);
    throw error;
  }
};

const OrdersService = {
  listOrders,
  getOrdersStats,
  getOrderById,
  createOrder,
  updateOrder,
  cancelOrder,
  assignOrderToRoute,
  deliverOrder,
  uploadVoucher,
  approvePayment
};

export default OrdersService;
